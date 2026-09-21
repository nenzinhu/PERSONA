import { test } from "node:test";
import assert from "node:assert/strict";
import { getProvider, modelsFor, recommend } from "../lib/providers.ts";

test("respeita override de modelos via ambiente", () => {
  const provider = getProvider("groq");
  assert(provider);
  const models = modelsFor(provider, { GROQ_MODELS: "modelo-custom" });
  assert.equal(models.length, 1);
  assert.equal(models[0]?.id, "modelo-custom");
});

test("recomenda modelos disponíveis por tipo de texto", () => {
  const groq = getProvider("groq");
  assert(groq);
  const result = recommend("casual", [{ id: "groq", models: modelsFor(groq) }]);
  assert(result.length > 0);
  assert.equal(result[0]?.provider, "groq");
});
