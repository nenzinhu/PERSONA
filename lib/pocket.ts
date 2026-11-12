// Cartão de bolso: o que dizer, o que perguntar e o meu limite, para levar impresso.
export const MAX_POCKET_ITEMS = 6;

const clean = (value: string) => value.trim().replace(/\s+/g, " ");

/** Aceita uma lista por linha ou separada por ponto e vírgula. */
export function splitPocketList(raw: string, max = MAX_POCKET_ITEMS): string[] {
  return raw
    .split(/\r?\n|;/)
    .map((line) => clean(line).replace(/^[-•*]\s*/, ""))
    .filter(Boolean)
    .slice(0, max);
}

export interface PocketCardInput {
  dizer: string;
  perguntar: string;
  limite: string;
}

export function buildPocketCard(input: PocketCardInput): string {
  const blocks: string[] = [];
  const dizer = splitPocketList(input.dizer);
  const perguntar = splitPocketList(input.perguntar);
  const limite = clean(input.limite);

  if (dizer.length) blocks.push(`O que preciso dizer\n${dizer.map((item) => `- ${item}`).join("\n")}`);
  if (perguntar.length) blocks.push(`O que preciso perguntar\n${perguntar.map((item) => `- ${item}`).join("\n")}`);
  if (limite) blocks.push(`Meu limite\n${limite}`);

  if (!blocks.length) return "";
  return ["CARTÃO DE BOLSO", ...blocks].join("\n\n");
}

export function pocketIsReady(input: PocketCardInput) {
  return Boolean(clean(input.dizer) || clean(input.perguntar) || clean(input.limite));
}
