import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRateLimitKey, clearRateLimitForTests } from "../lib/rateLimit.ts";

test("bloqueia requisições após a cota da janela", () => {
  clearRateLimitForTests();
  const config = { windowMs: 10_000, max: 2 };
  assert.equal(checkRateLimitKey("teste", config, 1_000).allowed, true);
  assert.equal(checkRateLimitKey("teste", config, 1_001).allowed, true);
  const blocked = checkRateLimitKey("teste", config, 1_002);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.resetInSeconds, 10);
});

test("libera novamente depois da janela", () => {
  clearRateLimitForTests();
  const config = { windowMs: 1_000, max: 1 };
  checkRateLimitKey("teste", config, 100);
  assert.equal(checkRateLimitKey("teste", config, 1_100).allowed, true);
});
