import test from "node:test";
import assert from "node:assert/strict";
import { applyCorrections, removeCorrection, upsertCorrection } from "../lib/corrections.ts";

const trocas = [
  { id: "mano", de: "mano", para: "senhor" },
  { id: "tipo assim", de: "tipo assim", para: "" },
];

test("correções: aplica as trocas e conta cada uma", () => {
  const result = applyCorrections("Mano, tipo assim, o mano confirma?", [
    { id: "mano", de: "mano", para: "senhor" },
    { id: "tipo assim", de: "tipo assim", para: "assim" },
  ]);
  assert.equal(result.text, "senhor, assim, o senhor confirma?");
  assert.deepEqual(result.applied, [
    { de: "Mano", para: "senhor", vezes: 2 },
    { de: "tipo assim", para: "assim", vezes: 1 },
  ]);
});

test("correções: respeita limites de palavra e ignora trocas vazias", () => {
  assert.equal(
    applyCorrections("manobra e mano", [{ id: "mano", de: "mano", para: "senhor" }]).text,
    "manobra e senhor",
  );
  assert.deepEqual(
    applyCorrections(
      "texto",
      trocas.filter((item) => !item.para),
    ),
    { text: "texto", applied: [] },
  );
  assert.deepEqual(applyCorrections("texto", []), { text: "texto", applied: [] });
});

test("correções: cadastro substitui a mesma origem e valida", () => {
  const list = upsertCorrection([], "Mano", "senhor");
  assert.equal(list[0].id, "mano");
  const updated = upsertCorrection(list, "mano", "chefe");
  assert.equal(updated.length, 1);
  assert.equal(updated[0].para, "chefe");
  assert.throws(() => upsertCorrection([], "", "x"), /Preencha/);
  assert.throws(() => upsertCorrection([], "igual", "igual"), /diferente/);
  assert.deepEqual(removeCorrection(updated, "mano"), []);
});
