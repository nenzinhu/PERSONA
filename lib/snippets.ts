// Biblioteca de respostas guardadas: reaproveitar o que já funcionou.
export const SNIPPET_TAGS = ["cobrar", "recusar", "confirmar", "pedir prazo", "agradecer", "outro"] as const;
export type SnippetTag = (typeof SNIPPET_TAGS)[number];

export interface Snippet {
  id: string;
  text: string;
  tag: SnippetTag;
  createdAt: string;
}

export const MAX_SNIPPETS = 200;
export const MAX_SNIPPET_LENGTH = 2000;

export function addSnippet(list: Snippet[], text: string, tag: SnippetTag, id: string, createdAt: string): Snippet[] {
  const clean = text.trim().slice(0, MAX_SNIPPET_LENGTH);
  if (!clean) throw new Error("Escreva a resposta antes de guardar.");
  if (list.some((item) => item.text.trim() === clean)) throw new Error("Esta resposta já está na biblioteca.");
  return [{ id, text: clean, tag, createdAt }, ...list].slice(0, MAX_SNIPPETS);
}

export function removeSnippet(list: Snippet[], id: string) {
  return list.filter((item) => item.id !== id);
}

/** Filtra por etiqueta e por busca livre no texto. */
export function filterSnippets(list: Snippet[], tag: SnippetTag | "todas", query: string) {
  const term = query.trim().toLowerCase();
  return list.filter(
    (item) => (tag === "todas" || item.tag === tag) && (!term || item.text.toLowerCase().includes(term)),
  );
}

export function snippetTagLabel(tag: SnippetTag) {
  return tag === "pedir prazo" ? "pedir prazo" : tag;
}
