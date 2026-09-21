# Fine-tuning do seu jeito de escrever

O app tem dois níveis de "treino":

| Nível                        | Como funciona                                                                          | Quando usar                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **1. Few-shot (automático)** | Os 20 exemplos mais recentes da aba _Meu estilo_ vão junto em cada pedido.             | Sempre. Funciona com Groq, Nous, Mistral, OpenRouter etc. sem treinar nada.                                         |
| **2. Fine-tuning LoRA**      | Treina um modelo aberto (Llama 3.1 8B) com as suas mensagens. O estilo fica nos pesos. | Ideal com **100+ exemplos**; o script aceita a partir de ~50, mas abaixo disso o few-shot costuma ser mais prático. |

> Groq, OpenRouter e NVIDIA não hospedam modelo treinado por você no plano grátis. Por isso o fine-tune roda no Colab e o modelo é servido pelo Ollama (ou outro endpoint compatível com OpenAI).

## Passo a passo

1. **Junte exemplos**: aba _Meu estilo_ → _Importar conversa do WhatsApp_ (várias conversas suas) e/ou "Salvar como meu exemplo" nas respostas que você editou.
2. **Baixe o dataset**: _Baixar JSONL (fine-tune)_ → `meu-estilo.jsonl`.
3. **Treine no Colab** (grátis, GPU T4, ~10–20 min para 500 exemplos):
   ```
   !pip install -r finetune/requirements.txt
   # envie meu-estilo.jsonl para a pasta atual
   !python finetune/train_unsloth.py
   ```
   O script valida o dataset, exige GPU CUDA e permite ajustar `EPOCHS`, `BASE_MODEL`, `DATA`, `OUT`, batch e LoRA por variáveis de ambiente.
4. **Baixe** o arquivo `.gguf` de `outputs/gguf/`.
5. **Rode no seu PC com Ollama**:
   ```
   # Modelfile
   FROM ./unsloth.Q4_K_M.gguf
   ```
   ```
   ollama create meu-estilo -f Modelfile
   ollama serve
   ```
6. **Ligue ao app no Vercel** expondo o Ollama com um túnel (ex.: `cloudflared tunnel --url http://localhost:11434`) e cadastre:
   - `CUSTOM_BASE_URL=https://SEU-TUNEL.trycloudflare.com/v1`
   - `CUSTOM_API_KEY=qualquer-coisa`
   - `CUSTOM_MODELS=meu-estilo`

   O provedor **Meu modelo (fine-tune)** aparece no app e passa a ser o recomendado para "Meu jeito (persona)".

## Dicas de dataset

- Qualidade > quantidade: apague pares em que a resposta não faz sentido sem o contexto.
- Misture assuntos (trabalho, amigos, família) para o modelo não ficar monotemático.
- Não inclua dados sensíveis de terceiros (telefones, endereços, senhas) — o `.gitignore` já ignora `*.jsonl` nesta pasta.
