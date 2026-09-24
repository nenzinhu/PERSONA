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

test("AnyAPI e OrcaRouter só precisam da chave: a base URL tem padrão", () => {
  const statuses = validateProviderEnv({ ANYAPI_API_KEY: "k", ORCAROUTER_API_KEY: "k" }).statuses;
  assert.equal(statuses.find((s) => s.id === "anyapi")?.configured, true);
  assert.equal(statuses.find((s) => s.id === "orcarouter")?.configured, true);
});

test("Cloudflare pede o id da conta, que entra na URL", () => {
  const sem = validateProviderEnv({ CLOUDFLARE_API_TOKEN: "t" }).statuses.find((s) => s.id === "cloudflare");
  assert.deepEqual(sem?.missing, ["CLOUDFLARE_ACCOUNT_ID"]);
  const com = validateProviderEnv({ CLOUDFLARE_API_TOKEN: "t", CLOUDFLARE_ACCOUNT_ID: "abc" }).statuses;
  assert.equal(com.find((s) => s.id === "cloudflare")?.configured, true);
});
