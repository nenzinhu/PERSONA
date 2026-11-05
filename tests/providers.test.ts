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

test("baseUrlFor troca {VAR} pela env e respeita a URL definida por env", async () => {
  const { baseUrlFor } = await import("../lib/llm.ts");
  const cloudflare = getProvider("cloudflare");
  assert(cloudflare);
  assert.equal(baseUrlFor(cloudflare, {}), undefined);
  assert.equal(
    baseUrlFor(cloudflare, { CLOUDFLARE_ACCOUNT_ID: "abc123" }),
    "https://api.cloudflare.com/client/v4/accounts/abc123/ai/v1",
  );
  const anyapi = getProvider("anyapi");
  assert(anyapi);
  assert.equal(baseUrlFor(anyapi, {}), "https://api.anyapi.ai/v1");
  assert.equal(baseUrlFor(anyapi, { ANYAPI_BASE_URL: "https://outro.ai/v1/" }), "https://outro.ai/v1");
});

test("Groq oferece somente os três modelos de texto escolhidos e identifica preview", () => {
  const groq = getProvider("groq");
  assert(groq);
  assert.deepEqual(
    groq.models.map((m) => m.id),
    ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"],
  );
  assert.match(groq.models[0]!.note, /preview/i);
});

test("Cohere distingue redação, análise, rascunhos e multilíngue", () => {
  const cohere = getProvider("cohere");
  assert(cohere);
  for (const id of [
    "command-a-plus-05-2026",
    "command-a-reasoning-08-2025",
    "command-a-03-2025",
    "c4ai-aya-expanse-32b",
  ]) {
    assert(
      cohere.models.some((model) => model.id === id),
      id,
    );
  }
  assert.equal(rankModels("formal", cohere.models)[0]?.id, "command-a-plus-05-2026");
  assert.equal(rankModels("argumento", cohere.models)[0]?.id, "command-a-reasoning-08-2025");
});

test("OpenRouter inclui quatro opções gerais da lista e preserva suas notas no override", () => {
  const provider = getProvider("openrouter");
  assert(provider);
  const ids = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3.5-super-vl:free",
    "dots-studio/dots-3-note-preview:free",
  ];
  for (const id of ids)
    assert(
      provider.models.some((model) => model.id === id),
      id,
    );
  const override = modelsFor(provider, { OPENROUTER_MODELS: ` ${ids[0]}, novo-modelo ` });
  assert.equal(
    override[0],
    provider.models.find((model) => model.id === ids[0]),
  );
  assert.equal(override[1]?.id, "novo-modelo");
  assert.equal(rankModels("formal", override)[0]?.id, ids[0]);
});
