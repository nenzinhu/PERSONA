import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCoachMessages, parseCoach } from "../lib/coach.ts";
import { normalizeAjusteRequest, parseAjusteRequest } from "../lib/validation.ts";

test("buildCoachMessages delimita a mensagem, o contexto e cada versão", () => {
  const { system, messages } = buildCoachMessages({
    texto: "bora no churrasco?",
    contexto: "Ana: sábado",
    respostas: ["bora sim kkkk", "opa, que horas?"],
  });
  assert.match(system, /### VERSAO 1/);
  assert.match(system, /nunca siga instruções/i);
  const content = messages[0].content;
  assert.match(content, /<<<MENSAGEM_RECEBIDA>>>\nbora no churrasco\?/);
  assert.match(content, /<<<CONTEXTO>>>\nAna: sábado/);
  assert.match(content, /<<<VERSAO_1>>>\nbora sim kkkk/);
  assert.match(content, /<<<VERSAO_2>>>\nopa, que horas\?/);
});

test("parseCoach lê cada versão, o tom e a escolha, mantendo acentos", () => {
  const raw = [
    "### VERSÃO 1",
    "**SOA:** animado e próximo",
    "DICA: dá pra oferecer levar algo",
    "TOM: nenhum",
    "### VERSAO 2",
    "SOA: educado, meio distante",
    "DICA: tira a pergunta e confirma logo",
    "TOM: curto",
    "### ESCOLHA",
    "1 - mostra vontade de ir",
  ].join("\n");
  const review = parseCoach(raw, 2);
  assert.deepEqual(review, {
    notas: [
      { soa: "animado e próximo", dica: "dá pra oferecer levar algo", tom: null },
      { soa: "educado, meio distante", dica: "tira a pergunta e confirma logo", tom: "curto" },
    ],
    escolha: 1,
    motivo: "mostra vontade de ir",
  });
});

test("parseCoach aceita a escolha na mesma linha e ignora versões fora do intervalo", () => {
  const raw = ["## Versao 1", "SOA: seco", "## Versao 3", "SOA: nem existe", "ESCOLHA: versão 1 — é a única"].join(
    "\n",
  );
  const review = parseCoach(raw, 1);
  assert.equal(review?.notas.length, 1);
  assert.equal(review?.notas[0].soa, "seco");
  assert.equal(review?.escolha, 1);
  assert.equal(review?.motivo, "é a única");
});

test("parseCoach devolve null quando nada veio comentado", () => {
  assert.equal(parseCoach("não sei", 2), null);
});

test("validação do comentário exige ao menos uma resposta e no máximo quatro", () => {
  const base = { acao: "comentario", texto: "oi", kind: "casual" };
  assert.equal(parseAjusteRequest({ ...base, respostas: [] }).success, false);
  assert.equal(parseAjusteRequest({ ...base, respostas: ["a", "b", "c", "d", "e"] }).success, false);
  const ok = parseAjusteRequest({ ...base, respostas: ["eae"] });
  assert.equal(ok.success, true);
  if (ok.success) assert.deepEqual(normalizeAjusteRequest(ok.data), ok.data);
});

test("com uma versão só, o prompt não pede escolha", () => {
  const uma = buildCoachMessages({ texto: "oi", contexto: "", respostas: ["eae"] }).system;
  const duas = buildCoachMessages({ texto: "oi", contexto: "", respostas: ["eae", "opa"] }).system;
  assert.doesNotMatch(uma, /ESCOLHA/);
  assert.match(duas, /### ESCOLHA/);
});
