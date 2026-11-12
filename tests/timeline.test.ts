import test from "node:test";
import assert from "node:assert/strict";
import { conversationStats, formatGapLabel } from "../lib/timeline.ts";

const msg = (from: string, hora?: string) => ({ from, text: "oi", ...(hora ? { hora } : {}) });

test("linha do tempo: conta mensagens por pessoa e o que tem horário", () => {
  const stats = conversationStats([msg("Ana", "09:00"), msg("Eu", "09:10"), msg("Ana", "09:20"), msg("Eu")]);
  assert.equal(stats.total, 4);
  assert.equal(stats.comHorario, 3);
  assert.deepEqual(stats.porPessoa, [
    { nome: "Ana", total: 2 },
    { nome: "Eu", total: 2 },
  ]);
  assert.equal(stats.primeiraHora, "09:00");
  assert.equal(stats.ultimaHora, "09:20");
});

test("linha do tempo: maior intervalo e tempo médio de resposta", () => {
  const stats = conversationStats([msg("Ana", "09:00"), msg("Eu", "09:05"), msg("Ana", "09:35"), msg("Eu", "09:40")]);
  assert.deepEqual(stats.maiorIntervalo, { minutos: 30, de: "Eu", para: "Ana" });
  assert.deepEqual(stats.respostaMedia, [
    { nome: "Eu", minutos: 5, respostas: 2 },
    { nome: "Ana", minutos: 30, respostas: 1 },
  ]);
});

test("linha do tempo: sem horário não inventa medida", () => {
  const stats = conversationStats([msg("Ana"), msg("Eu")]);
  assert.equal(stats.comHorario, 0);
  assert.equal(stats.maiorIntervalo, null);
  assert.deepEqual(stats.respostaMedia, []);
  assert.equal(stats.primeiraHora, "");
});

test("linha do tempo: horário que volta no dia é ignorado na conta", () => {
  const stats = conversationStats([msg("Ana", "23:50"), msg("Eu", "00:10")]);
  assert.equal(stats.maiorIntervalo, null);
  assert.deepEqual(stats.respostaMedia, []);
});

test("linha do tempo: rótulo do intervalo é legível", () => {
  assert.equal(formatGapLabel(45), "45 min");
  assert.equal(formatGapLabel(60), "1 h");
  assert.equal(formatGapLabel(95), "1 h 35 min");
});
