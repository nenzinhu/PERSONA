import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeStoredValue, parseStoredValue } from "../lib/store.ts";

test("faz merge profundo de configurações antigas", () => {
  const initial = { humanize: { abbreviation: 50, typoRate: 3, casual: true }, variacoes: 2 };
  const incoming = { humanize: { abbreviation: 80 }, variacoes: 4 };
  assert.deepEqual(mergeStoredValue(initial, incoming), {
    humanize: { abbreviation: 80, typoRate: 3, casual: true },
    variacoes: 4,
  });
});

test("substitui arrays em vez de misturar posições", () => {
  assert.deepEqual(mergeStoredValue({ exemplos: ["novo"] }, { exemplos: ["antigo", "mais antigo"] }), {
    exemplos: ["antigo", "mais antigo"],
  });
});

test("descarta armazenamento corrompido ou incompatível", () => {
  const initial = { exemplos: ["novo"] };
  assert.deepEqual(parseStoredValue("null", initial), initial);
  assert.deepEqual(parseStoredValue(JSON.stringify({ exemplos: "corrompido" }), initial), initial);
  assert.deepEqual(parseStoredValue("{", initial), initial);
});

test("preserva valores primitivos compatíveis, como o tema", () => {
  assert.equal(parseStoredValue(JSON.stringify("dark"), "system"), "dark");
  assert.equal(parseStoredValue("null", "system"), "system");
});
