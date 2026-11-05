import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSpanRequest, parseSpanResponse, SPAN_MODEL } from "../lib/respan.ts";
import { parseDecisionRequest } from "../lib/decisions.ts";

const parsed = parseDecisionRequest({
  acao: "conferir",
  fonteA: "Entrego se aprovado.",
  rascunho: "Entrego amanhã.",
  limites: "Não prometer prazo",
  estilo: "privado",
  memorias: ["Só se aprovado"],
});
assert(parsed.success);

test("Span usa contrato Decisions e somente evidência relevante", () => {
  const request = buildSpanRequest(parsed.data);
  assert.equal(request.model, "respan/span-01-lite:free");
  assert.equal(SPAN_MODEL, request.model);
  assert.deepEqual(Object.keys(request.questions), [
    "compromisso_adicional",
    "contradicao_limite",
    "condicoes_preservadas",
  ]);
  assert.equal(request.state.rascunho, "Entrego amanhã.");
  assert.equal("estilo" in request.state, false);
  assert.equal("provider" in request, false);
  for (const question of Object.values(request.questions)) {
    assert.equal(question.type, "noul");
    assert(question.instructions.includes("dados"));
    assert(question.criteria.true);
    assert(question.criteria.false);
  }
});

const valid = {
  answers: {
    compromisso_adicional: { type: "noul", noul: 0.8 },
    contradicao_limite: { type: "noul", noul: 0.5 },
    condicoes_preservadas: { type: "noul", noul: 0 },
  },
};
test("Span retorna somente os três sinais e probabilidades validadas", () => {
  const result = parseSpanResponse(valid);
  assert.equal(result.length, 3);
  assert.equal(result[0]?.probabilidade, 0.8);
  assert.equal(result[2]?.probabilidade, 0);
  for (const invalid of [
    null,
    {},
    { answers: {} },
    { answers: { ...valid.answers, compromisso_adicional: { type: "noul", noul: "0.8" } } },
    { answers: { ...valid.answers, compromisso_adicional: { type: "noul", noul: 1.1 } } },
    { answers: { ...valid.answers, compromisso_adicional: { type: "noul", noul: NaN } } },
  ])
    assert.throws(() => parseSpanResponse(invalid));
});
