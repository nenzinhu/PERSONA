"use client";

import { useState } from "react";
import { parseDataset, toDpoJsonl, toJsonl, type Preference } from "@/lib/dataset";
import { useLocalState } from "@/lib/store";
import { MAX_EXAMPLES, type StyleProfile } from "@/lib/prompt";
import { listSenders, parseWhatsAppExport, toExamples, type ChatMessage } from "@/lib/whatsapp";

interface Props {
  perfil: StyleProfile;
  setPerfil: (fn: (p: StyleProfile) => StyleProfile) => void;
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function exampleKey(example: { contexto: string; resposta: string }) {
  return `${example.contexto.trim()}\n\u0000${example.resposta.trim()}`;
}

function uniqueExamples(examples: { contexto: string; resposta: string }[]) {
  const seen = new Set<string>();
  return examples.filter((example) => {
    const key = exampleKey(example);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function StyleTrainer({ perfil, setPerfil }: Props) {
  const [contexto, setContexto] = useState("");
  const [resposta, setResposta] = useState("");
  const [chat, setChat] = useState<ChatMessage[] | null>(null);
  const [me, setMe] = useState("");
  const [msg, setMsg] = useState("");
  const [preferencias] = useLocalState<Preference[]>("preferencias", []);

  const senders = chat ? listSenders(chat) : [];
  const preview = chat && me ? toExamples(chat, me) : [];

  function add() {
    const next = { contexto: contexto.trim(), resposta: resposta.trim() };
    if (!next.contexto || !next.resposta) return;
    if (perfil.exemplos.some((example) => exampleKey(example) === exampleKey(next))) {
      setMsg("Esse exemplo já está salvo.");
      return;
    }
    setPerfil((p) => ({ ...p, exemplos: [...p.exemplos, next] }));
    setContexto("");
    setResposta("");
    setMsg("");
  }

  async function onWhatsFile(file: File) {
    try {
      const parsed = parseWhatsAppExport(await file.text());
      setChat(parsed);
      setMe("");
      setMsg(
        parsed.length
          ? `${parsed.length} mensagens lidas. Escolha quem é você.`
          : "Não reconheci o formato. Exporte a conversa ‘sem mídia’.",
      );
    } catch {
      setMsg("Não consegui ler esse arquivo. Exporte a conversa como TXT e sem mídia.");
    }
  }

  async function onDatasetFile(file: File) {
    try {
      const examples = parseDataset(await file.text());
      setPerfil((current) => ({ ...current, exemplos: uniqueExamples([...current.exemplos, ...examples]) }));
      setMsg(
        examples.length
          ? `${examples.length} exemplos recebidos; duplicatas foram ignoradas.`
          : "Nenhum exemplo válido foi encontrado.",
      );
    } catch {
      setMsg("Não consegui importar esse arquivo. Use JSON ou JSONL válido.");
    }
  }

  const total = perfil.exemplos.length;

  return (
    <section className="grid">
      <div className="card">
        <h2>Quem é você</h2>
        <label className="field">
          <span>Seu nome / apelido</span>
          <input
            value={perfil.nome}
            onChange={(e) => setPerfil((p) => ({ ...p, nome: e.target.value }))}
            placeholder="ex: Jeferson"
          />
        </label>
        <label className="field">
          <span>Como você escreve</span>
          <textarea
            rows={3}
            value={perfil.descricao}
            onChange={(e) => setPerfil((p) => ({ ...p, descricao: e.target.value }))}
            placeholder="ex: respondo curto, falo 'mano' e 'tlgd', quase não uso vírgula, não uso emoji, sou meio zoeiro"
          />
        </label>

        <h2>Adicionar exemplo real</h2>
        <p className="muted small">Cole algo que te mandaram e o que VOCÊ respondeu de verdade.</p>
        <label className="field">
          <span>Mensagem que recebi</span>
          <textarea rows={2} value={contexto} onChange={(e) => setContexto(e.target.value)} />
        </label>
        <label className="field">
          <span>O que eu respondi</span>
          <textarea rows={2} value={resposta} onChange={(e) => setResposta(e.target.value)} />
        </label>
        <button className="primary" onClick={add} disabled={!contexto.trim() || !resposta.trim()}>
          Adicionar
        </button>

        <h2>Importar conversa do WhatsApp</h2>
        <p className="muted small">
          No WhatsApp: abra a conversa → ⋮ → Mais → Exportar conversa → Sem mídia. Envie o .txt aqui (é lido só no seu
          navegador).
        </p>
        <input type="file" accept=".txt" onChange={(e) => e.target.files?.[0] && onWhatsFile(e.target.files[0])} />
        {chat && senders.length > 0 && (
          <div className="field">
            <span>Qual desses é você?</span>
            <div className="seg wrap">
              {senders.slice(0, 6).map((s) => (
                <button key={s} className={me === s ? "on" : ""} onClick={() => setMe(s)}>
                  {s}
                </button>
              ))}
            </div>
            {me && (
              <button
                className="primary"
                disabled={!preview.length}
                onClick={() => {
                  setPerfil((current) => ({
                    ...current,
                    exemplos: uniqueExamples([...current.exemplos, ...preview]),
                  }));
                  const added = uniqueExamples([...perfil.exemplos, ...preview]).length - perfil.exemplos.length;
                  setMsg(added ? `${added} pares adicionados.` : "Nenhum par novo para adicionar.");
                  setChat(null);
                }}
              >
                Adicionar {preview.length} pares
              </button>
            )}
          </div>
        )}
        {msg && <p className="muted small">{msg}</p>}
      </div>

      <div className="card">
        <h2>Treino ({total} exemplos)</h2>
        <ol className="levels">
          <li>
            <b>Automático (few-shot):</b> os {MAX_EXAMPLES} exemplos mais recentes vão junto em cada pedido. Funciona
            com qualquer modelo grátis, sem treinar nada.
          </li>
          <li>
            <b>Fine-tuning de verdade:</b> com 100+ exemplos, baixe o JSONL e rode o notebook da pasta{" "}
            <code>finetune/</code> no Google Colab grátis (LoRA com Unsloth). O modelo aprende seu jeito nos pesos.
          </li>
        </ol>
        <div className="actions">
          <button
            className="act"
            disabled={!total}
            onClick={() => download("meu-estilo.jsonl", toJsonl(perfil), "application/jsonl")}
          >
            Baixar JSONL (fine-tune)
          </button>
          <button
            className="act"
            disabled={!preferencias.length}
            title="Pares escolhida × rejeitada do botão 👍 Prefiro esta"
            onClick={() => download("minhas-preferencias.jsonl", toDpoJsonl(preferencias), "application/jsonl")}
          >
            Exportar DPO ({preferencias.length} {preferencias.length === 1 ? "preferência" : "preferências"})
          </button>
          <button
            className="act"
            onClick={() => download("perfil-backup.json", JSON.stringify(perfil, null, 2), "application/json")}
          >
            Backup JSON
          </button>
          <label className="act file">
            Importar JSON/JSONL
            <input
              type="file"
              accept=".json,.jsonl"
              hidden
              onChange={(e) => e.target.files?.[0] && onDatasetFile(e.target.files[0])}
            />
          </label>
          {total > 0 && (
            <button
              className="act ghost"
              onClick={() =>
                confirm("Apagar todos os exemplos deste navegador?") && setPerfil((p) => ({ ...p, exemplos: [] }))
              }
            >
              Limpar tudo
            </button>
          )}
        </div>

        <ul className="examples">
          {[...perfil.exemplos]
            .reverse()
            .slice(0, 100)
            .map((ex, ri) => {
              const i = total - 1 - ri;
              return (
                <li key={i}>
                  <p className="them">{ex.contexto}</p>
                  <p className="me">{ex.resposta}</p>
                  <button
                    className="x"
                    aria-label="Remover"
                    onClick={() => setPerfil((p) => ({ ...p, exemplos: p.exemplos.filter((_, j) => j !== i) }))}
                  >
                    ×
                  </button>
                </li>
              );
            })}
        </ul>
        {total > 100 && <p className="muted small">Mostrando os 100 mais recentes.</p>}
      </div>
    </section>
  );
}
