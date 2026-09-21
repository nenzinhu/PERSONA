# Fine-tuning (LoRA) do seu jeito de escrever — rode no Google Colab grátis (GPU T4).
#
# 1. No app, aba "Meu estilo" -> "Baixar JSONL (fine-tune)" -> arquivo meu-estilo.jsonl
# 2. Colab: Ambiente de execução -> Alterar tipo -> GPU T4
# 3. Instale as dependências: !pip install -r finetune/requirements.txt
# 4. Envie meu-estilo.jsonl para o Colab e rode: !python train_unsloth.py
#
# Saída: outputs/gguf com o modelo em GGUF para usar no Ollama.

import json
import os
from pathlib import Path

import torch
from datasets import Dataset
from trl import SFTConfig, SFTTrainer
from unsloth import FastLanguageModel
from unsloth.chat_templates import get_chat_template, train_on_responses_only

BASE_MODEL = os.environ.get("BASE_MODEL", "unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit")
DATA = Path(os.environ.get("DATA", "meu-estilo.jsonl"))
EPOCHS = int(os.environ.get("EPOCHS", "3"))
OUT = Path(os.environ.get("OUT", "outputs"))
MAX_SEQ_LENGTH = int(os.environ.get("MAX_SEQ_LENGTH", "1024"))
MICRO_BATCH_SIZE = int(os.environ.get("MICRO_BATCH_SIZE", "2"))
GRADIENT_ACCUMULATION = int(os.environ.get("GRADIENT_ACCUMULATION", "4"))
LEARNING_RATE = float(os.environ.get("LEARNING_RATE", "2e-4"))
LORA_R = int(os.environ.get("LORA_R", "16"))
LORA_ALPHA = int(os.environ.get("LORA_ALPHA", "16"))


def load_rows(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(f"Dataset não encontrado: {path}")
    rows: list[dict] = []
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError as error:
            raise ValueError(f"JSON inválido na linha {number}: {error}") from error
        messages = row.get("messages") if isinstance(row, dict) else None
        if not isinstance(messages, list) or len(messages) < 2:
            raise ValueError(f"Linha {number} precisa conter messages[].")
        rows.append(row)
    if not rows:
        raise ValueError("Dataset vazio. Adicione exemplos antes de iniciar o fine-tune.")
    return rows


if not torch.cuda.is_available():
    raise SystemExit("Este treino requer GPU CUDA. Selecione uma GPU no Colab antes de executar.")

rows = load_rows(DATA)
if len(rows) < 50:
    print("Aviso: com menos de ~50 exemplos o fine-tune ajuda pouco; o few-shot do app pode ser suficiente.")
else:
    print(f"{len(rows)} exemplos carregados")

OUT.mkdir(parents=True, exist_ok=True)
model, tokenizer = FastLanguageModel.from_pretrained(
    BASE_MODEL,
    max_seq_length=MAX_SEQ_LENGTH,
    load_in_4bit=True,
)
model = FastLanguageModel.get_peft_model(
    model,
    r=LORA_R,
    lora_alpha=LORA_ALPHA,
    lora_dropout=0,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    use_gradient_checkpointing="unsloth",
)
tokenizer = get_chat_template(tokenizer, chat_template="llama-3.1")

dataset = Dataset.from_list(rows).map(
    lambda example: {
        "text": tokenizer.apply_chat_template(example["messages"], tokenize=False),
    }
)

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    args=SFTConfig(
        dataset_text_field="text",
        per_device_train_batch_size=MICRO_BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION,
        num_train_epochs=EPOCHS,
        learning_rate=LEARNING_RATE,
        warmup_steps=5,
        logging_steps=5,
        optim="adamw_8bit",
        output_dir=str(OUT / "lora-training"),
        report_to="none",
    ),
)
trainer = train_on_responses_only(
    trainer,
    instruction_part="<|start_header_id|>user<|end_header_id|>\n\n",
    response_part="<|start_header_id|>assistant<|end_header_id|>\n\n",
)
trainer.train()

FastLanguageModel.for_inference(model)
sample = rows[0]["messages"] + [{"role": "user", "content": "e aí, vai sair hoje?"}]
input_ids = tokenizer.apply_chat_template(sample, add_generation_prompt=True, return_tensors="pt").to("cuda")
output = model.generate(input_ids=input_ids, max_new_tokens=60, temperature=0.9)[0]
print(tokenizer.decode(output[input_ids.shape[1]:], skip_special_tokens=True))

model.save_pretrained(OUT / "lora")
tokenizer.save_pretrained(OUT / "lora")
model.save_pretrained_gguf(OUT / "gguf", tokenizer, quantization_method="q4_k_m")
print(f"Pronto: {OUT / 'gguf'} (baixe o .gguf para usar no Ollama)")
