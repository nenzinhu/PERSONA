import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReadingMessages, buildToneMessages, parseReading, TONES } from "../lib/adjust.ts";
import { parseAjusteRequest } from "../lib/validation.ts";

const perfil = { nome: "Jef", descricao: "curto", exemplos: [{ contexto: "oi", resposta: "eae" }] };

test("buildToneMessages traz a instrução do tom e a resposta atual delimitada", () => {
  const { system, messages } = buildToneMessages({
    texto: "acho q sim, te aviso",
    tom: "carinhoso",
    contexto: "vc vem sexta?",
    kind: "casual",
    tracos: [],
    emoji: false,
    perfil,
  });
  assert.match(system, /carinhos/i);
  assert.match(system, /Jef/);
  const last = messages.at(-1)?.content ?? "";
  assert.match(last, /<<<RESPOSTA_ATUAL>>>\nacho q sim, te aviso/);
  assert.match(last, /<<<MENSAGEM_RECEBIDA>>>\nvc vem sexta\?/);
  assert.ok(messages.some((m) => m.role === "assistant" && m.content.includes("eae")));
});

test("todos os tons têm instrução própria", () => {
  const systems = TONES.map(
    (tom) =>
      buildToneMessages({ texto: "ok", tom, contexto: "", kind: "casual", tracos: [], emoji: false, perfil }).system,
  );
  assert.equal(new Set(systems).size, TONES.length);
});

test("buildReadingMessages delimita a mensagem e o contexto", () => {
  const { messages } = buildReadingMessages({ texto: "tá bom então", contexto: "Ana: vc esqueceu de novo" });
  assert.match(messages[0].content, /<<<MENSAGEM>>>\ntá bom então/);
  assert.match(messages[0].content, /<<<CONTEXTO>>>\nAna: vc esqueceu de novo/);
});

test("parseReading lê as quatro seções", () => {
  const reading = parseReading(
    "### EMOÇÃO\nchateada\n### INTENÇÃO\nmostrar que ficou magoada\n### ENTRELINHAS\nnão tá bom nada\n### CUIDADO\nnão responda só 'ok'",
  );
  assert.deepEqual(reading, {
    emocao: "chateada",
    intencao: "mostrar que ficou magoada",
    entrelinhas: "não tá bom nada",
    cuidado: "não responda só 'ok'",
  });
});

test("parseReading aceita seções parciais e recusa texto sem títulos", () => {
  assert.deepEqual(parseReading("**Emoção:** animado"), {
    emocao: "animado",
    intencao: "",
    entrelinhas: "",
    cuidado: "",
  });
  assert.equal(parseReading("ela parece chateada"), null);
});

test("parseAjusteRequest valida as duas ações", () => {
  const tom = parseAjusteRequest({ acao: "tom", tom: "seco", texto: "beleza" });
  assert.equal(tom.success, true);
  assert.equal(parseAjusteRequest({ acao: "tom", tom: "bravo", texto: "beleza" }).success, false);
  assert.equal(parseAjusteRequest({ acao: "tom", tom: "seco", texto: "  " }).success, false);
  const analise = parseAjusteRequest({ acao: "analise", texto: "tá bom então" });
  assert.equal(analise.success, true);
  assert.equal(parseAjusteRequest({ acao: "outra", texto: "x" }).success, false);
});
