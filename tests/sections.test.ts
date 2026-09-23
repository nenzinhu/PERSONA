import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSections } from "../lib/prompt.ts";

const HEADINGS: ["a" | "b", RegExp][] = [
  ["a", /^emocao\b/],
  ["b", /^entrelinhas\b/],
];

test("parseSections lê títulos com #, ** e numeração, ignorando acento", () => {
  const raw = "### EMOÇÃO\nirritada\n\n**2. Entrelinhas:** quer atenção\ncontinua aqui";
  assert.deepEqual(parseSections(raw, HEADINGS), [
    { section: "a", text: "irritada" },
    { section: "b", text: "quer atenção\ncontinua aqui" },
  ]);
});

test("parseSections sem títulos devolve lista vazia", () => {
  assert.deepEqual(parseSections("só um texto qualquer", HEADINGS), []);
});

test("parseSections não confunde frase comum com título", () => {
  assert.deepEqual(parseSections("### Emoção\nemocao boa demais kkk", HEADINGS), [
    { section: "a", text: "emocao boa demais kkk" },
  ]);
});
