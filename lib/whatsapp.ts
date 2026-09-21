import type { StyleExample } from "./prompt.ts";

// Formatos encontrados em exportações brasileiras, inglesas e internacionais.
const LINE_PATTERNS = [
  /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2})(?::\d{2})?\]?\s*(?:-\s*)?([^:]{1,80}):\s?(.*)$/,
  /^\[?(\d{4}-\d{1,2}-\d{1,2})[ ,]+(\d{1,2}:\d{2})(?::\d{2})?\]?\s*(?:-\s*)?([^:]{1,80}):\s?(.*)$/,
  /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}:\d{2}\s?(?:AM|PM)),?\]?\s*(?:-\s*)?([^:]{1,80}):\s?(.*)$/i,
];

const SKIP =
  /^(?:<(mídia oculta|media omitted)>|mensagem apagada|this message was deleted|arquivo anexado|attached file|‎)\s*$/i;

export interface ChatMessage {
  from: string;
  text: string;
}

function parseMessageLine(line: string): ChatMessage | null {
  for (const pattern of LINE_PATTERNS) {
    const match = line.match(pattern);
    if (!match) continue;
    const from = match[3].trim();
    const text = match[4].trim();
    if (!from || !text) return null;
    return { from, text };
  }
  return null;
}

export function parseWhatsAppExport(raw: string): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const line of raw.replace(/\r/g, "").split("\n")) {
    const message = parseMessageLine(line);
    if (message) {
      out.push(message);
    } else if (out.length && line.trim()) {
      out[out.length - 1].text += "\n" + line.trimEnd();
    }
  }
  return out.filter((message) => message.text.trim() && !SKIP.test(message.text));
}

export function listSenders(messages: ChatMessage[]): string[] {
  const count = new Map<string, number>();
  for (const message of messages) count.set(message.from, (count.get(message.from) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

/** Agrupa mensagens seguidas do mesmo remetente e pareia a última mensagem externa com a resposta. */
export function toExamples(messages: ChatMessage[], me: string, max = 200): StyleExample[] {
  const blocks: ChatMessage[] = [];
  for (const message of messages) {
    const last = blocks[blocks.length - 1];
    if (last && last.from === message.from) last.text += "\n" + message.text;
    else blocks.push({ ...message });
  }

  const pairs: StyleExample[] = [];
  const seen = new Set<string>();
  for (let index = 1; index < blocks.length; index += 1) {
    if (blocks[index].from !== me) continue;
    let previous = index - 1;
    while (previous >= 0 && blocks[previous].from === me) previous -= 1;
    if (previous < 0) continue;
    const contexto = blocks[previous].text.trim().slice(0, 1000);
    const resposta = blocks[index].text.trim().slice(0, 1000);
    if (!contexto || !resposta) continue;
    const key = `${contexto}\n\u0000${resposta}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ contexto, resposta });
  }
  return pairs.slice(-max);
}

export function isValidWhatsAppPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}
