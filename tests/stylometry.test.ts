import { test } from "node:test";
import assert from "node:assert/strict";
import { calibrate, fingerprint, styleScore } from "../lib/stylometry.ts";

const MEUS = [
  "vc vai hj? to indo dps do almoço",
  "nao sei ainda kkkk pq ta chovendo",
  "blz, vlw mano",
  "tambem acho, mt caro isso",
];

test("fingerprint mede abreviação, falta de acento, pontuação e risada", () => {
  const fp = fingerprint(MEUS);
  assert.equal(fp.samples, 4);
  assert.equal(fp.abbreviation, 1); // só formas curtas
  assert.equal(fp.noAccent, 1); // "nao", "tambem"
  assert.equal(fp.noFinalPeriod, 1);
  assert.equal(fp.lowerStart, 1);
  assert.equal(fp.kkk, 1);
  assert.equal(fp.emojis, 0);
  assert.ok(fp.avgWords > 3 && fp.avgWords < 8);
});

test("fingerprint devolve null quando não há dado para medir", () => {
  const fp = fingerprint(["Ok!"]);
  assert.equal(fp.abbreviation, null);
  assert.equal(fp.noAccent, null);
  assert.equal(fp.kkk, null);
  assert.equal(fp.noFinalPeriod, null); // termina em "!", não conta
});

test("fingerprint de texto formal", () => {
  const fp = fingerprint(["Você também vai hoje? Não sei.", "Está tudo certo, obrigado."]);
  assert.equal(fp.abbreviation, 0);
  assert.equal(fp.noAccent, 0);
  assert.equal(fp.noFinalPeriod, 0);
  assert.equal(fp.lowerStart, 0);
});

test("calibrate converte o fingerprint nos controles do humanizador", () => {
  const c = calibrate(fingerprint(MEUS));
  assert.equal(c.humanize.abbreviation, 100);
  assert.equal(c.humanize.typoRate, 20);
  assert.equal(c.humanize.casual, true);
  assert.equal(c.humanize.kkk, true);
  assert.equal(c.emoji, false);

  const formal = calibrate(fingerprint(["Você também vai hoje? Não sei.", "Está tudo certo, obrigado."]));
  assert.equal(formal.humanize.abbreviation, 0);
  assert.equal(formal.humanize.typoRate, 0);
  assert.equal(formal.humanize.casual, false);
});

test("calibrate não mexe no que não dá para medir", () => {
  const c = calibrate(fingerprint(["Ok!"]));
  assert.equal(c.humanize.abbreviation, undefined);
  assert.equal(c.humanize.typoRate, undefined);
  assert.equal(c.humanize.kkk, undefined);
});

test("styleScore dá nota alta para texto no mesmo estilo e baixa para estilo oposto", () => {
  const fp = fingerprint(MEUS);
  const parecido = styleScore("vc vem hj? nao sei kkkk", fp);
  const diferente = styleScore(
    "Olá! Você também virá hoje à reunião? Não tenho certeza sobre o horário, mas acredito que será às quinze horas.",
    fp,
  );
  assert.ok(parecido.score >= 70, `parecido=${parecido.score}`);
  assert.ok(diferente.score < 40, `diferente=${diferente.score}`);
  assert.ok(diferente.hints.length > 0);
  assert.ok(parecido.score <= 100 && diferente.score >= 0);
});

test("styleScore explica o que está diferente", () => {
  const fp = fingerprint(MEUS);
  const { hints } = styleScore("Você também vai hoje.", fp);
  assert.ok(hints.some((h) => h.includes("abrevia")));
  assert.ok(hints.some((h) => h.includes("ponto final")));
});
