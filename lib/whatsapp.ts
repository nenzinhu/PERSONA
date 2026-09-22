import type { StyleExample } from "./prompt.ts";

// Formatos encontrados em exportações brasileiras, inglesas e internacionais.
const LINE_PATTERNS = [
  /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2})(?::\d{2})?\]?\s*(?:-\s*)?([^:]{1,80}):\s?(.*)$/,
  /^\[?(\d{4}-\d{1,2}-\d{1,2})[ ,]+(\d{1,2}:\d{2})(?::\d{2})?\]?\s*(?:-\s*)?([^:]{1,80}):\s?(.*)$/,
  /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}:\d{2}\s?(?:AM|PM)),?\]?\s*(?:-\s*)?([^:]{1,80}):\s?(.*)$/i,
];

// Mensagens copiadas no app (segurar → Copiar): "[21:03, 21/09/2026] Ana: texto" (hora antes da data).
const COPIED_PATTERN =
  /^\[(\d{1,2}:\d{2})(?::\d{2})?(?:\s?[AP]M)?,\s*(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{1,2}-\d{1,2})\]\s*([^:]{1,80}):\s?(.*)$/i;
// "Ana: texto" digitado à mão. O nome precisa parecer nome (maiúscula ou telefone, até 4 palavras)
// para não confundir com frases como "o horário é: 20h".
const SIMPLE_PATTERN = /^()()((?:\p{Lu}|\+?\d)[^:.!?]{0,39}):\s?(.*)$/u;

/** Máximo de mensagens enviadas ao modo agente (as mais recentes). */
export const MAX_CONVERSATION = 40;

const SKIP =
  /^(?:<(mídia oculta|media omitted)>|mensagem apagada|this message was deleted|arquivo anexado|attached file|‎)\s*$/i;

export interface ChatMessage {
  from: string;
  text: string;
}

function parseMessageLine(line: string, patterns: RegExp[]): ChatMessage | null {
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (!match) continue;
    const from = match[3].trim();
    const text = match[4].trim();
    if (!from || !text) return null;
    if (pattern === SIMPLE_PATTERN && from.split(/\s+/).length > 4) return null;
    return { from, text };
  }
  return null;
}

export function parseWhatsAppExport(raw: string): ChatMessage[] {
  return parseLines(raw, LINE_PATTERNS);
}

/** Trecho colado no modo agente: mensagens copiadas, formato exportado ou "Nome: texto". */
export function parseConversation(raw: string): ChatMessage[] {
  return parseLines(raw, [COPIED_PATTERN, ...LINE_PATTERNS, SIMPLE_PATTERN]);
}

function parseLines(raw: string, patterns: RegExp[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const line of raw.replace(/\r/g, "").split("\n")) {
    const message = parseMessageLine(line, patterns);
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
