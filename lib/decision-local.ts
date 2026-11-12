export interface AliasEntry {
  original: string;
  alias: string;
}
export interface PendingSuggestion {
  tipo: "pergunta" | "pedido" | "compromisso";
  descricao: string;
  responsavel: string;
  prazo: string;
  condicao: string;
  fonte: string;
}
export interface SavedPending extends PendingSuggestion {
  id: string;
  assunto: string;
  status: "aberto" | "concluido";
  confirmadoEm: string;
  /** Data de vencimento opcional (AAAA-MM-DD), escolhida pela pessoa. */
  vencimento?: string;
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function matcher(words: string[]) {
  return new RegExp(
    `(?<![\\p{L}\\p{N}_])(?:${[...words]
      .sort((a, b) => b.length - a.length)
      .map(escape)
      .join("|")})(?![\\p{L}\\p{N}_])`,
    "gu",
  );
}

export function validateAliases(entries: AliasEntry[], text: string): void {
  if (entries.length > 20) throw new Error("Use até 20 substituições por vez.");
  const seenOriginal = new Set<string>();
  const seenAlias = new Set<string>();
  for (const entry of entries) {
    if (!entry.original.trim() || !entry.alias.trim())
      throw new Error("Preencha o termo e o apelido de cada substituição.");
    if (entry.original.length > 120 || entry.alias.length > 120)
      throw new Error("Cada termo ou apelido deve ter até 120 caracteres.");
    if (seenOriginal.has(entry.original) || seenAlias.has(entry.alias))
      throw new Error("Use termos e apelidos diferentes em cada linha.");
    seenOriginal.add(entry.original);
    seenAlias.add(entry.alias);
    if (matcher([entry.alias]).test(text))
      throw new Error(`O apelido “${entry.alias}” já aparece no texto. Escolha outro.`);
  }
  for (const entry of entries) {
    if (entries.some((other) => matcher([other.original]).test(entry.alias)))
      throw new Error("Os apelidos não podem conter termos originais. Use, por exemplo, Pessoa A ou Local B.");
  }
}

export function protectText(text: string, entries: AliasEntry[]): string {
  if (!entries.length) return text;
  validateAliases(entries, text);
  const mapping = new Map(entries.map((entry) => [entry.original, entry.alias]));
  return text.replace(matcher([...mapping.keys()]), (word) => mapping.get(word) ?? word);
}

export function restoreText(text: string, entries: AliasEntry[]): string {
  if (!entries.length) return text;
  const mapping = new Map(entries.map((entry) => [entry.alias, entry.original]));
  return text.replace(matcher([...mapping.keys()]), (word) => mapping.get(word) ?? word);
}

/** Content transformation only; transport identifiers and enum values are never rewritten. */
export function mapContentText<T>(value: T, transform: (text: string) => string): T {
  if (typeof value === "string") return transform(value) as T;
  if (Array.isArray(value)) return value.map((item) => mapContentText(item, transform)) as T;
  if (value && typeof value === "object") {
    const fixed = new Set([
      "acao",
      "tipo",
      "provider",
      "providerLabel",
      "model",
      "kind",
      "intencao",
      "tomEncerramento",
    ]);
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, fixed.has(key) ? item : mapContentText(item, transform)]),
    ) as T;
  }
  return value;
}

export function confirmPending(
  item: PendingSuggestion,
  subject: string,
  confirmed: boolean,
  id: string,
  date: string,
  previous?: SavedPending,
): SavedPending {
  if (!confirmed) throw new Error("Confirme a pendência antes de salvar.");
  if (!subject.trim()) throw new Error("Dê um nome ao assunto para separar os compromissos.");
  if (!item.descricao.trim() || !item.fonte.trim())
    throw new Error("A pendência precisa de descrição e trecho de origem.");
  return { ...item, id, assunto: subject.trim(), status: previous?.status ?? "aberto", confirmadoEm: date };
}

export function changePendingStatus(item: SavedPending, status: SavedPending["status"]): SavedPending {
  return { ...item, status };
}
