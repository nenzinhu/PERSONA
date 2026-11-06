export function preservesLockedPhrases(text: string, phrases: readonly string[]) {
  let offset = 0;
  for (const phrase of phrases) {
    const start = text.indexOf(phrase, offset);
    if (start === -1) return false;
    offset = start + phrase.length;
  }
  return true;
}

export function lockSelection(text: string, start: number, end: number, phrases: string[]) {
  const selected = text.slice(start, end).trim();
  if (!selected || phrases.includes(selected)) return phrases;
  return [...phrases, selected].sort((a, b) => text.indexOf(a) - text.indexOf(b));
}

const promiseStart =
  /^(?:(?:eu|nós|a gente)\s+)?(?:vou\s+\p{L}+|vamos\s+\p{L}+|me comprometo|garanto|confirmo|prometo|entrego|envio|pago|resolvo|compareço|retorno|chego|farei|faremos|entregarei|enviarei|pagarei|resolverei|estará|estarão|vai ficar|fica pronto)(?!\p{L})/iu;

export function newCommitments(text: string, before = "") {
  const normalize = (value: string) =>
    value
      .trim()
      .replace(/[.!]+$/, "")
      .replace(/\s+/g, " ")
      .toLowerCase();
  const previous = new Set(splitClauses(before).map(normalize));
  return splitClauses(text).filter(
    (clause) => !clause.endsWith("?") && promiseStart.test(clause) && !previous.has(normalize(clause)),
  );
}

function splitClauses(text: string) {
  return (text.match(/(?:\d[.,]\d|[^.!?;\n])+[.!?]?/g) ?? []).map((clause) => clause.trim()).filter(Boolean);
}
