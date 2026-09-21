import type { StyleExample, StyleProfile } from "./prompt.ts";

/** Um exemplo por linha no formato "messages" (aceito por Unsloth, OpenAI, Together, HF TRL). */
export function toJsonl(perfil: StyleProfile): string {
  const system = `Você é ${perfil.nome || "eu"} respondendo mensagens no WhatsApp com o seu jeito de escrever.${
    perfil.descricao ? " " + perfil.descricao : ""
  }`;
  return perfil.exemplos
    .filter((e) => e.contexto.trim() && e.resposta.trim())
    .map((e) =>
      JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: e.contexto.trim() },
          { role: "assistant", content: e.resposta.trim() },
        ],
      }),
    )
    .join("\n");
}

/** Escolha do teste A/B: a resposta preferida e a que perdeu, para a mesma mensagem. */
export interface Preference {
  contexto: string;
  chosen: string;
  rejected: string;
}

/** Formato de preferência {prompt, chosen, rejected} (DPO/ORPO no HF TRL e Unsloth). */
export function toDpoJsonl(preferencias: Preference[]): string {
  return preferencias
    .map((p) => ({ prompt: p.contexto.trim(), chosen: p.chosen.trim(), rejected: p.rejected.trim() }))
    .filter((p) => p.prompt && p.chosen && p.rejected && p.chosen !== p.rejected)
    .map((p) => JSON.stringify(p))
    .join("\n");
}

/** Aceita JSON de backup ({exemplos: [...]}), array de exemplos ou JSONL no formato messages. */
export function parseDataset(raw: string): StyleExample[] {
  const text = raw.trim();
  if (!text) return [];
  try {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : data.exemplos;
    if (Array.isArray(arr)) return arr.map(normalize).filter(Boolean) as StyleExample[];
  } catch {
    /* não é JSON único: tenta JSONL */
  }
  return text
    .split("\n")
    .map((line) => {
      try {
        return normalize(JSON.parse(line));
      } catch {
        return null;
      }
    })
    .filter(Boolean) as StyleExample[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function cleanText(value: string) {
  return value.trim().replace(/\s+\n/g, "\n").slice(0, 1000);
}

function normalize(x: unknown): StyleExample | null {
  if (!isRecord(x)) return null;
  if (typeof x.contexto === "string" && typeof x.resposta === "string" && x.contexto.trim() && x.resposta.trim()) {
    return { contexto: cleanText(x.contexto), resposta: cleanText(x.resposta) };
  }
  if (Array.isArray(x.messages)) {
    const reversed = [...x.messages].reverse();
    const userMessage = reversed.find((message) => isRecord(message) && message.role === "user");
    const assistantMessage = reversed.find((message) => isRecord(message) && message.role === "assistant");
    if (
      isRecord(userMessage) &&
      isRecord(assistantMessage) &&
      typeof userMessage.content === "string" &&
      typeof assistantMessage.content === "string" &&
      userMessage.content.trim() &&
      assistantMessage.content.trim()
    ) {
      return { contexto: cleanText(userMessage.content), resposta: cleanText(assistantMessage.content) };
    }
  }
  return null;
}
