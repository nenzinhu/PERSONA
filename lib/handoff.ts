// Passagem de bastão: transformar uma conversa longa em um cartão de continuidade.
export const HANDOFF_KINDS = [
  { id: "fato", label: "Fato confirmado", heading: "Fatos confirmados" },
  { id: "duvida", label: "Dúvida em aberto", heading: "Dúvidas em aberto" },
  { id: "acao", label: "Próxima ação", heading: "Próximas ações" },
] as const;

export type HandoffKind = (typeof HANDOFF_KINDS)[number]["id"];

export interface HandoffItem {
  id: string;
  kind: HandoffKind;
  text: string;
  source: string;
}

export interface HandoffCard {
  items: HandoffItem[];
  responsavel: string;
  proximaAcao: string;
}

export const MAX_HANDOFF_LINES = 40;
export const MAX_HANDOFF_ITEMS = 20;

const clean = (value: string) => value.trim().replace(/\s+/g, " ");

/** Cada linha da conversa vira um candidato; o texto original é preservado como origem. */
export function conversationLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_HANDOFF_LINES);
}

export function handoffItem(line: string, index: number, kind: HandoffKind = "fato"): HandoffItem {
  const text = clean(line);
  return { id: `item-${index}-${text.length}`, kind, text, source: text };
}

export function handoffIsReady(card: HandoffCard) {
  return card.items.some((item) => clean(item.text));
}

/** Cartão em texto puro, com a origem de cada item e a revisão explícita. */
export function buildHandoffCard(card: HandoffCard): string {
  const items = card.items
    .map((item) => ({ ...item, text: clean(item.text), source: clean(item.source) }))
    .filter((item) => item.text);

  if (!items.length) return "";

  const blocks = HANDOFF_KINDS.map(({ id, heading }) => {
    const group = items.filter((item) => item.kind === id);
    if (!group.length) return "";
    const lines = group.map((item) => {
      const origin = item.source && item.source !== item.text ? `\n  origem: "${item.source}"` : "";
      return `- ${item.text}${origin}`;
    });
    return `${heading}\n${lines.join("\n")}`;
  }).filter(Boolean);

  const responsavel = clean(card.responsavel);
  const proximaAcao = clean(card.proximaAcao);
  if (responsavel) blocks.push(`Responsável: ${responsavel}`);
  if (proximaAcao) blocks.push(`Próxima ação: ${proximaAcao}`);

  blocks.push("Confira cada item com a conversa original antes de enviar.");

  return ["PASSAGEM DE BASTÃO", ...blocks].join("\n\n");
}
