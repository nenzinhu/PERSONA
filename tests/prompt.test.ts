import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMessages, MAX_EXAMPLES, profileForRequest, splitVariations } from "../lib/prompt.ts";
import { parseConversaRequest, parseGenerateRequest } from "../lib/validation.ts";

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

test("profileForRequest mantém só os exemplos mais recentes e passa na validação", () => {
  const exemplos = Array.from({ length: 150 }, (_, i) => ({ contexto: `oi ${i}`, resposta: `eae ${i}` }));
  const perfil = profileForRequest({ nome: "eu", descricao: "", exemplos });
  assert.equal(perfil.exemplos.length, MAX_EXAMPLES);
  assert.equal(perfil.exemplos.at(-1)?.resposta, "eae 149");
  assert.equal(parseGenerateRequest({ texto: "oi", perfil }).success, true);
  const mensagens = [{ eu: false, nome: "Ana", texto: "oi" }];
  assert.equal(parseConversaRequest({ mensagens, perfil }).success, true);
});

test("separa variações somente pelo marcador combinado", () => {
  assert.deepEqual(splitVariations("primeira\n###\nsegunda"), ["primeira", "segunda"]);
  assert.deepEqual(splitVariations("texto com ### no meio"), ["texto com ### no meio"]);
});
