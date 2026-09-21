import { test } from "node:test";
import assert from "node:assert/strict";
import { validateProviderEnv } from "../lib/env.ts";

test("considera o ambiente válido quando ao menos um provedor está configurado", () => {
  const result = validateProviderEnv({ GROQ_API_KEY: "chave", NOUS_API_KEY: undefined });
  assert.equal(result.valid, true);
  assert.equal(result.configuredCount, 1);
});

test("considera o ambiente inválido sem nenhum provedor configurado", () => {
  const result = validateProviderEnv({});
  assert.equal(result.valid, false);
  assert.equal(result.configuredCount, 0);
  assert.ok(result.missingKeys.length > 0);
});
