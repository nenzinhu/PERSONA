import test from "node:test";
import assert from "node:assert/strict";
import { addSnippet, filterSnippets, removeSnippet, MAX_SNIPPETS } from "../lib/snippets.ts";

const snippet = (id: string, text: string, tag: "cobrar" | "recusar" = "cobrar") => ({
  id,
  text,
  tag,
  createdAt: "2026-11-12T10:00:00.000Z",
});

test("biblioteca: guarda no topo, sem duplicar e com limite", () => {
  const list = addSnippet([], "  Posso confirmar amanhã?  ", "confirmar", "1", "2026-11-12T10:00:00.000Z");
  assert.equal(list[0].text, "Posso confirmar amanhã?");
  assert.throws(() => addSnippet(list, "Posso confirmar amanhã?", "confirmar", "2", "x"), /já está/);
  assert.throws(() => addSnippet(list, "   ", "outro", "3", "x"), /Escreva/);
  const many = Array.from({ length: MAX_SNIPPETS + 5 }, (_, index) => snippet(String(index), `resposta ${index}`));
  assert.equal(addSnippet(many, "nova", "outro", "x", "y").length, MAX_SNIPPETS);
});

test("biblioteca: filtra por etiqueta e por busca", () => {
  const list = [snippet("1", "Preciso de mais prazo", "cobrar"), snippet("2", "Não consigo assumir", "recusar")];
  assert.deepEqual(
    filterSnippets(list, "recusar", "").map((item) => item.id),
    ["2"],
  );
  assert.deepEqual(
    filterSnippets(list, "todas", "prazo").map((item) => item.id),
    ["1"],
  );
  assert.equal(filterSnippets(list, "todas", "").length, 2);
});

test("biblioteca: remover tira só o item pedido", () => {
  const list = [snippet("1", "a"), snippet("2", "b")];
  assert.deepEqual(
    removeSnippet(list, "1").map((item) => item.id),
    ["2"],
  );
});
