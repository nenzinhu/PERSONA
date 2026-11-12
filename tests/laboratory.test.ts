import { test } from "node:test";
import assert from "node:assert/strict";
import { wordCount, compressionStats, buildRepair, buildRealityCheck, capsuleReady } from "../lib/laboratory.ts";

test("compressão conta palavras e impede aprovar rascunho vazio ou longo", () => {
  assert.equal(wordCount("  Olá,\n tudo bem?  "), 3);
  assert.equal(compressionStats("um dois três quatro", "um dois", 2).ready, true);
  assert.equal(compressionStats("texto", "", 20).ready, false);
  assert.equal(compressionStats("texto", "um dois três", 2).ready, false);
  assert.equal(compressionStats("", "", 20).reduction, 0);
});

test("reparação exige responsabilidade, impacto e ação sem inventar conteúdo", () => {
  assert.equal(buildRepair("", "impacto", "ação"), "");
  const result = buildRepair("interrompi você", "você não terminou", "ouvir até o fim");
  assert.match(result, /interrompi você/);
  assert.match(result, /ouvir até o fim/);
});

test("checagem mantém observação separada de interpretação", () => {
  const result = buildRealityCheck("Não respondeu", "Está bravo", "Está ocupado", "Pode falar depois?");
  assert.match(result, /Observação: Não respondeu/);
  assert.match(result, /Interpretação \(não confirmada\): Está bravo/);
});

test("cápsula só libera comparação após prazo válido", () => {
  assert.equal(capsuleReady("inválido", 100), false);
  assert.equal(capsuleReady(new Date(200).toISOString(), 100), false);
  assert.equal(capsuleReady(new Date(100).toISOString(), 100), true);
});
