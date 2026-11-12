import test from "node:test";
import assert from "node:assert/strict";
import { addTrainingEntry, trainingProgress } from "../lib/training-journal.ts";

const entry = (nota: number | null, situacao = "recusar", date = "2026-11-12T10:00:00.000Z") => ({
  id: `${situacao}-${nota}-${date}`,
  date,
  situacao,
  nota,
  resumo: "",
});

test("jornada de treino: guarda no topo e limita o tamanho da situação", () => {
  const list = addTrainingEntry([], entry(7, "  recusar convite  "), "1");
  assert.equal(list[0].situacao, "recusar convite");
  assert.equal(list[0].id, "1");
  const semSituacao = addTrainingEntry([], entry(5, "   "), "2");
  assert.equal(semSituacao[0].situacao, "Sem situação");
});

test("jornada de treino: média, última nota e tendência", () => {
  const list = [entry(9), entry(8), entry(7), entry(4), entry(5), entry(6)];
  const progress = trainingProgress(list);
  assert.equal(progress.total, 6);
  assert.equal(progress.ultima, 9);
  assert.equal(progress.media, 6.5);
  assert.equal(progress.tendencia, 3); // (9+8+7)/3 = 8 contra (4+5+6)/3 = 5
});

test("jornada de treino: sem notas não inventa média", () => {
  const progress = trainingProgress([entry(null), entry(null)]);
  assert.equal(progress.media, null);
  assert.equal(progress.ultima, null);
  assert.equal(progress.tendencia, null);
  assert.deepEqual(progress.porSituacao, []);
});

test("jornada de treino: agrupa por situação", () => {
  const progress = trainingProgress([entry(8, "cobrar"), entry(6, "cobrar"), entry(9, "recusar")]);
  assert.deepEqual(progress.porSituacao, [
    { situacao: "cobrar", total: 2, media: 7 },
    { situacao: "recusar", total: 1, media: 9 },
  ]);
});
