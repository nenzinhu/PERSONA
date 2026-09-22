import { test } from "node:test";
import assert from "node:assert/strict";
import { getProvider, modelsFor, rankModels, recommend } from "../lib/providers.ts";

test("respeita override de modelos via ambiente", () => {
  const provider = getProvider("groq");
  assert(provider);
  const models = modelsFor(provider, { GROQ_MODELS: "modelo-custom" });
  assert.equal(models.length, 1);
  assert.equal(models[0]?.id, "modelo-custom");
});

test("rankModels ordena os modelos do provedor pela nota do tipo de texto", () => {
  const groq = getProvider("groq");
  assert(groq);
  for (const kind of ["casual", "formal"] as const) {
    const ranked = rankModels(kind, modelsFor(groq));
    assert.equal(ranked.length, modelsFor(groq).length);
    assert.equal(ranked[0]?.id, recommend(kind, [{ id: "groq", models: modelsFor(groq) }])[0]?.model);
  }
});

test("recomenda modelos disponíveis por tipo de texto", () => {
  const groq = getProvider("groq");
  assert(groq);
  const result = recommend("casual", [{ id: "groq", models: modelsFor(groq) }]);
  assert(result.length > 0);
  assert.equal(result[0]?.provider, "groq");
});
