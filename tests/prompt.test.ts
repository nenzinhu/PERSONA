import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMessages, splitVariations } from "../lib/prompt.ts";

test("delimita exemplos e nova mensagem como dados", () => {
  const result = buildMessages({
    mode: "pergunta",
    texto: "vai sair?",
    kind: "casual",
    tracos: [],
    emoji: false,
    variacoes: 1,
    perfil: {
      nome: "eu",
      descricao: "respondo curto",
      exemplos: [{ contexto: "oi", resposta: "eae" }],
    },
  });
  assert.match(result.system, /dados de referência/i);
  assert.match(result.messages[0]?.content ?? "", /EXEMPLO_DE_ESTILO_1/);
  assert.match(result.messages.at(-1)?.content ?? "", /NOVA_MENSAGEM/);
});

test("separa variações somente pelo marcador combinado", () => {
  assert.deepEqual(splitVariations("primeira\n###\nsegunda"), ["primeira", "segunda"]);
  assert.deepEqual(splitVariations("texto com ### no meio"), ["texto com ### no meio"]);
});
