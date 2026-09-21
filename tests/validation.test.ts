import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGenerateRequest, validationErrorText } from "../lib/validation.ts";

test("rejeita corpo nulo ou texto vazio", () => {
  const nullBody = parseGenerateRequest(null);
  assert.equal(nullBody.success, false);
  if (!nullBody.success) assert.ok(validationErrorText(nullBody.error).length > 0);

  const emptyBody = parseGenerateRequest({ texto: "   ", perfil: { exemplos: [] } });
  assert.equal(emptyBody.success, false);
});

test("normaliza valores e limita exemplos", () => {
  const parsed = parseGenerateRequest({
    texto: "  oi  ",
    variacoes: 99,
    temperatura: 9,
    perfil: {
      nome: "  eu  ",
      descricao: "curto",
      exemplos: Array.from({ length: 101 }, () => ({ contexto: "oi", resposta: "oi" })),
    },
  });
  assert.equal(parsed.success, false);
  if (!parsed.success) assert.ok(parsed.error.issues.some((issue) => issue.path.at(-1) === "exemplos"));
});

test("aceita requisição mínima e aplica padrões", () => {
  const parsed = parseGenerateRequest({ texto: "oi" });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.mode, "pergunta");
    assert.equal(parsed.data.kind, "casual");
    assert.equal(parsed.data.variacoes, 1);
    assert.equal(parsed.data.provider, "auto");
  }
});

test("alinha os limites ao prompt e rejeita stance fora do modo afirmação", () => {
  const tooManyExamples = parseGenerateRequest({
    texto: "oi",
    perfil: { exemplos: Array.from({ length: 21 }, () => ({ contexto: "oi", resposta: "oi" })) },
  });
  assert.equal(tooManyExamples.success, false);

  const invalidStance = parseGenerateRequest({
    texto: "oi",
    mode: "pergunta",
    stance: "curioso",
  });
  assert.equal(invalidStance.success, false);
  if (!invalidStance.success) {
    assert.ok(invalidStance.error.issues.some((issue) => issue.path.at(-1) === "stance"));
  }
});
