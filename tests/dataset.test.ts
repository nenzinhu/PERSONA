import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDataset, toDpoJsonl } from "../lib/dataset.ts";

test("normaliza e limita exemplos importados", () => {
  const examples = parseDataset(
    JSON.stringify([
      {
        contexto: `  ${"a".repeat(1200)}`,
        resposta: `  ${"b".repeat(1200)}  `,
      },
    ]),
  );
  assert.equal(examples.length, 1);
  assert.equal(examples[0]?.contexto.length, 1000);
  assert.equal(examples[0]?.resposta.length, 1000);
  assert.equal(examples[0]?.contexto.startsWith("a"), true);
  assert.equal(examples[0]?.resposta.endsWith("b"), true);
});

test("ignora mensagens sem conteúdo utilizável", () => {
  assert.deepEqual(
    parseDataset(
      JSON.stringify([
        {
          messages: [
            { role: "user", content: "   " },
            { role: "assistant", content: "oi" },
          ],
        },
        {
          messages: [
            { role: "user", content: "oi" },
            { role: "assistant", content: "" },
          ],
        },
      ]),
    ),
    [],
  );
});

test("toDpoJsonl gera um par escolhida × rejeitada por linha", () => {
  const out = toDpoJsonl([
    { contexto: " vai hoje? ", chosen: "vo sim", rejected: "Sim, eu irei." },
    { contexto: "", chosen: "x", rejected: "y" },
    { contexto: "e ai", chosen: "igual", rejected: "igual" },
  ]);
  const lines = out.split("\n");
  assert.equal(lines.length, 1);
  assert.deepEqual(JSON.parse(lines[0]!), { prompt: "vai hoje?", chosen: "vo sim", rejected: "Sim, eu irei." });
});
