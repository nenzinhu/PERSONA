// Dicionário de acordos: expressões ambíguas e o significado combinado entre as pessoas.
export const DEFAULT_AMBIGUOUS_TERMS = [
  "mais tarde",
  "quando der",
  "depois",
  "logo",
  "em breve",
  "quando possível",
  "semana que vem",
  "a combinar",
  "está resolvido",
  "tá resolvido",
  "a gente vê",
];

export interface Agreement {
  id: string;
  termo: string;
  significado: string;
}

export interface AgreementHit {
  termo: string;
  significado: string;
  ocorrencias: number;
}

export const MAX_AGREEMENT_TERM = 60;
export const MAX_AGREEMENT_MEANING = 240;
export const MAX_AGREEMENTS = 40;

export function normalizeTerm(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Procura as expressões ambíguas no texto e devolve o significado combinado
 * quando ele existe. O significado nunca é deduzido: sem acordo registrado,
 * `significado` fica vazio.
 */
export function findAgreements(
  text: string,
  agreements: Agreement[],
  terms: string[] = DEFAULT_AMBIGUOUS_TERMS,
): AgreementHit[] {
  const meanings = new Map<string, string>();
  for (const term of terms) {
    const normalized = normalizeTerm(term);
    if (normalized) meanings.set(normalized, "");
  }
  for (const agreement of agreements) {
    const normalized = normalizeTerm(agreement.termo);
    if (!normalized) continue;
    meanings.set(normalized, agreement.significado.trim());
  }

  const hits: AgreementHit[] = [];
  for (const [termo, significado] of meanings) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escape(termo)}(?![\\p{L}\\p{N}])`, "giu");
    const ocorrencias = [...text.matchAll(pattern)].length;
    if (ocorrencias > 0) hits.push({ termo, significado, ocorrencias });
  }

  return hits.sort((a, b) => TEXT_ORDER(text, a.termo) - TEXT_ORDER(text, b.termo));
}

function TEXT_ORDER(text: string, termo: string) {
  return text.toLowerCase().indexOf(termo.toLowerCase());
}

/** Pergunta de precisão para a expressão, sem sugerir um significado. */
export function precisionQuestion(termo: string) {
  return `Quando você escreve «${normalizeTerm(termo)}», isso quer dizer até quando ou em que condição?`;
}

export function upsertAgreement(agreements: Agreement[], termo: string, significado: string): Agreement[] {
  const normalized = normalizeTerm(termo).slice(0, MAX_AGREEMENT_TERM);
  if (!normalized || !significado.trim()) return agreements;
  const entry: Agreement = {
    id: normalized,
    termo: normalized,
    significado: significado.trim().slice(0, MAX_AGREEMENT_MEANING),
  };
  return [entry, ...agreements.filter((item) => normalizeTerm(item.termo) !== normalized)].slice(0, MAX_AGREEMENTS);
}
