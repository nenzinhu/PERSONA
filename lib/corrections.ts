// Correções pessoais: o que você sempre ajusta antes de enviar.
export interface Correction {
  id: string;
  de: string;
  para: string;
}

export const MAX_CORRECTIONS = 40;
export const MAX_CORRECTION_LENGTH = 60;

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function matcher(terms: string[]) {
  return new RegExp(
    `(?<![\\p{L}\\p{N}_])(?:${[...terms]
      .sort((a, b) => b.length - a.length)
      .map(escape)
      .join("|")})(?![\\p{L}\\p{N}_])`,
    "giu",
  );
}

export interface AppliedCorrection {
  de: string;
  para: string;
  vezes: number;
}

/** Aplica as trocas e informa quantas vezes cada uma entrou. */
export function applyCorrections(
  text: string,
  corrections: Correction[],
): { text: string; applied: AppliedCorrection[] } {
  const valid = corrections.filter((item) => item.de.trim() && item.para.trim() && item.de.trim() !== item.para.trim());
  if (!valid.length) return { text, applied: [] };

  const map = new Map(valid.map((item) => [item.de.trim().toLowerCase(), item.para.trim()]));
  const applied: AppliedCorrection[] = [];
  const result = text.replace(matcher(valid.map((item) => item.de.trim())), (word) => {
    const replacement = map.get(word.toLowerCase());
    if (replacement === undefined) return word;
    const entry = applied.find((item) => item.de.toLowerCase() === word.toLowerCase());
    if (entry) entry.vezes += 1;
    else applied.push({ de: word, para: replacement, vezes: 1 });
    return replacement;
  });
  return { text: result, applied };
}

export function upsertCorrection(list: Correction[], de: string, para: string): Correction[] {
  const original = de.trim().slice(0, MAX_CORRECTION_LENGTH);
  const replacement = para.trim().slice(0, MAX_CORRECTION_LENGTH);
  if (!original || !replacement) throw new Error("Preencha o termo e a troca.");
  if (original.toLowerCase() === replacement.toLowerCase()) throw new Error("A troca precisa ser diferente do termo.");
  const id = original.toLowerCase();
  return [{ id, de: original, para: replacement }, ...list.filter((item) => item.id !== id)].slice(0, MAX_CORRECTIONS);
}

export function removeCorrection(list: Correction[], id: string) {
  return list.filter((item) => item.id !== id);
}
