import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEvaluationMessages, buildSimulatorMessages, parseEvaluation } from "../lib/simulator.ts";
import { parseSimularRequest } from "../lib/validation.ts";

const PESSOA = { nome: "Carlos", jeito: "chefe impaciente, responde seco", situacao: "vou pedir aumento" };

test("buildSimulatorMessages põe a IA no papel da pessoa e alterna os turnos", () => {
  const { system, messages } = buildSimulatorMessages({
    pessoa: PESSOA,
    historico: [
      { eu: true, texto: "oi Carlos, tem 5 min?" },
      { eu: false, texto: "fala rápido" },
      { eu: true, texto: "queria falar do meu salário" },
    ],
  });
  assert.match(system, /Carlos/);
  assert.match(system, /chefe impaciente/);
  assert.match(system, /nunca/i);
  assert.deepEqual(
    messages.map((m) => m.role),
    ["user", "assistant", "user"],
  );
  assert.equal(messages[1].content, "fala rápido");
});

test("buildSimulatorMessages sem histórico pede a primeira mensagem da pessoa", () => {
  const { messages } = buildSimulatorMessages({ pessoa: PESSOA, historico: [] });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].role, "user");
  assert.match(messages[0].content, /primeira mensagem/i);
});

test("buildSimulatorMessages junta turnos seguidos do mesmo lado e termina com o usuário", () => {
  const { messages } = buildSimulatorMessages({
    pessoa: PESSOA,
    historico: [
      { eu: false, texto: "e aí" },
      { eu: true, texto: "oi" },
      { eu: true, texto: "tudo bem?" },
    ],
  });
  assert.deepEqual(
    messages.map((m) => m.role),
    ["user", "assistant", "user"],
  );
  assert.equal(messages[2].content, "oi\ntudo bem?");
});

test("buildEvaluationMessages manda a conversa e pede as três seções", () => {
  const { system, messages } = buildEvaluationMessages({
    pessoa: PESSOA,
    historico: [
      { eu: true, texto: "quero aumento" },
      { eu: false, texto: "por quê?" },
    ],
  });
  assert.match(system, /### FUNCIONOU/);
  assert.match(system, /### MELHORAR/);
  assert.match(system, /### NOTA/);
  assert.match(messages[0].content, /Você: quero aumento\nCarlos: por quê\?/);
  assert.match(messages[0].content, /<<<OBJETIVO>>>\nvou pedir aumento/);
});

test("parseEvaluation lê as seções e a nota de 0 a 10", () => {
  assert.deepEqual(parseEvaluation("### FUNCIONOU\nfoi direto\n### MELHORAR\ntraga números\n### NOTA\n7/10"), {
    funcionou: "foi direto",
    melhorar: "traga números",
    nota: 7,
  });
  assert.equal(parseEvaluation("### NOTA\n15")?.nota, 10);
  assert.equal(parseEvaluation("### NOTA\nsem nota")?.nota, null);
  assert.equal(parseEvaluation("achei ok"), null);
});

test("parseSimularRequest valida as ações", () => {
  const base = { pessoa: { nome: "Carlos" } };
  assert.equal(parseSimularRequest({ ...base, acao: "responder", historico: [] }).success, true);
  assert.equal(parseSimularRequest({ acao: "responder", pessoa: { nome: "" }, historico: [] }).success, false);
  assert.equal(parseSimularRequest({ ...base, acao: "avaliar", historico: [] }).success, false);
  assert.equal(parseSimularRequest({ ...base, acao: "avaliar", historico: [{ eu: true, texto: "oi" }] }).success, true);
  const longo = Array.from({ length: 31 }, () => ({ eu: true, texto: "oi" }));
  assert.equal(parseSimularRequest({ ...base, acao: "responder", historico: longo }).success, false);
});
