import type { StyleExample } from "./prompt.ts";

// Grupos nomeados: data, hora (com segundos/AM/PM opcionais), from e text.
// Formatos encontrados em exportações brasileiras, inglesas e internacionais.
const LINE_PATTERNS = [
  /^\[?(?<data>\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(?<hora>\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?),?\]?\s*(?:-\s*)?(?<from>[^:]{1,80}):\s?(?<text>.*)$/i,
  /^\[?(?<data>\d{4}-\d{1,2}-\d{1,2})[ ,]+(?<hora>\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(?:-\s*)?(?<from>[^:]{1,80}):\s?(?<text>.*)$/,
];

// Mensagens copiadas no app (segurar → Copiar): "[21:03, 21/09/2026] Ana: texto" (hora antes da data).
const COPIED_PATTERN =
  /^\[(?<hora>\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?),\s*(?<data>\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{1,2}-\d{1,2})\]\s*(?<from>[^:]{1,80}):\s?(?<text>.*)$/i;
// "Ana: texto" digitado à mão. O nome precisa parecer nome (maiúscula ou telefone, até 4 palavras)
// para não confundir com frases como "o horário é: 20h".
const SIMPLE_PATTERN = /^(?<from>(?:\p{Lu}|\+?\d)[^:.!?]{0,39}):\s?(?<text>.*)$/u;

/** "9:03:12 PM" → "21:03"; "21:03" → "21:03". */
function normalizeTime(raw: string): string {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s?([AP]M)?$/i);
  if (!match) return raw.trim();
  let hours = Number(match[1]) % 24;
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

/** Máximo de mensagens enviadas ao modo agente (as mais recentes). */
export const MAX_CONVERSATION = 40;

const SKIP =
  /^(?:<(mídia oculta|media omitted)>|mensagem apagada|this message was deleted|arquivo anexado|attached file|‎)\s*$/i;

export interface ChatMessage {
  from: string;
  text: string;
  /** "HH:MM" em 24h, quando a linha tem cabeçalho de data/hora. */
  hora?: string;
  data?: string;
}

function parseMessageLine(line: string, patterns: RegExp[]): ChatMessage | null {
  for (const pattern of patterns) {
    const groups = line.match(pattern)?.groups;
    if (!groups) continue;
    const from = groups.from.trim();
    const text = groups.text.trim();
    if (!from || !text) return null;
    if (pattern === SIMPLE_PATTERN && from.split(/\s+/).length > 4) return null;
    const message: ChatMessage = { from, text };
    if (groups.hora) message.hora = normalizeTime(groups.hora);
    if (groups.data) message.data = groups.data;
    return message;
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
