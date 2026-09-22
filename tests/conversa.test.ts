import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_CONVERSATION, parseConversation } from "../lib/whatsapp.ts";
import { buildConversationMessages, parseAgentOutput } from "../lib/prompt.ts";
import { parseConversaRequest } from "../lib/validation.ts";

const PERFIL = { nome: "Jef", descricao: "", exemplos: [{ contexto: "vai hj?", resposta: "vo sim" }] };

test("parseConversation lê mensagens copiadas (hora antes da data) e continua linhas", () => {
  const raw = [
    "[21:03, 21/09/2026] Ana: vc vem sexta?",
    "[21:05, 21/09/2026] Jef: acho q sim",
    "mas confirmo dps",
    "[21:40, 21/09/2026] Ana: preciso saber hj",
  ].join("\n");
  assert.deepEqual(parseConversation(raw), [
    { from: "Ana", text: "vc vem sexta?" },
    { from: "Jef", text: "acho q sim\nmas confirmo dps" },
    { from: "Ana", text: "preciso saber hj" },
  ]);
});

test("parseConversation aceita o formato exportado e linhas simples Nome: texto", () => {
  assert.deepEqual(parseConversation("21/09/2026 21:03 - Ana: oi\nJef: e ai"), [
    { from: "Ana", text: "oi" },
    { from: "Jef", text: "e ai" },
  ]);
});

test("parseConversation não confunde texto com dois-pontos no meio da frase", () => {
  const out = parseConversation("Ana: bora\no horário é: 20h");
  assert.deepEqual(out, [{ from: "Ana", text: "bora\no horário é: 20h" }]);
});

test("MAX_CONVERSATION é 40", () => {
  assert.equal(MAX_CONVERSATION, 40);
});

test("buildConversationMessages monta blocos de conversa e objetivo", () => {
  const { system, messages } = buildConversationMessages({
    mensagens: [
      { eu: false, nome: "Ana", texto: "vc vem sexta?" },
      { eu: true, nome: "Jef", texto: "acho q sim" },
      { eu: false, nome: "Ana", texto: "preciso saber hj" },
    ],
    objetivo: "remarcar pra sábado",
    kind: "casual",
    tracos: [],
    emoji: false,
    perfil: PERFIL,
  });
  assert.match(system, /### PLANO/);
  assert.match(system, /### RESPOSTA/);
  assert.match(system, /Jef/);
  // Exemplos vão como dados (não como turnos do assistente), para não competir com o formato de seções.
  assert.equal(messages.length, 1);
  const last = messages.at(-1)!.content;
  assert.match(last, /<<<EXEMPLOS_DE_ESTILO>>>[\s\S]*Você respondeu: vo sim/);
  assert.match(last, /<<<CONVERSA>>>/);
  assert.match(last, /Ana: vc vem sexta\?/);
  assert.match(last, /Você: acho q sim/);
  assert.match(last, /<<<OBJETIVO>>>\nremarcar pra sábado/);
});

test("buildConversationMessages sem objetivo usa o padrão", () => {
  const { messages } = buildConversationMessages({
    mensagens: [{ eu: false, nome: "Ana", texto: "oi" }],
    objetivo: "",
    kind: "casual",
    tracos: [],
    emoji: false,
    perfil: { nome: "", descricao: "", exemplos: [] },
  });
  assert.match(messages.at(-1)!.content, /<<<OBJETIVO>>>\nresponder bem/);
});

test("parseAgentOutput lê plano, resposta e réplicas", () => {
  const raw = [
    "### PLANO",
    "reconhecer e propor sábado",
    "### RESPOSTA",
    "pô foi mal, sábado rola?",
    "### SE ELA DISSER",
    "sábado não dá",
    "### VOCÊ RESPONDE",
    "blz, e domingo?",
    "### SE ELA DISSER",
    "rola sim",
    "### VOCÊ RESPONDE",
    "fechou entao",
  ].join("\n");
  assert.deepEqual(parseAgentOutput(raw), {
    plano: "reconhecer e propor sábado",
    resposta: "pô foi mal, sábado rola?",
    replicas: [
      { deles: "sábado não dá", voce: "blz, e domingo?" },
      { deles: "rola sim", voce: "fechou entao" },
    ],
  });
});

test("parseAgentOutput tolera variações de título e réplica incompleta", () => {
  const raw = [
    "**Plano:** ser direto",
    "## 2. Resposta",
    "vou sim",
    "### Se ele disser:",
    "certeza?",
    "### Voce responde",
    "ctz",
    "### SE ELE DISSER",
    "sem tréplica",
  ].join("\n");
  assert.deepEqual(parseAgentOutput(raw), {
    plano: "ser direto",
    resposta: "vou sim",
    replicas: [{ deles: "certeza?", voce: "ctz" }],
  });
});

test("parseAgentOutput sem títulos usa o texto todo como resposta", () => {
  assert.deepEqual(parseAgentOutput("  vou sim, sábado  "), { plano: "", resposta: "vou sim, sábado", replicas: [] });
});

test("parseConversaRequest valida e limita a conversa", () => {
  const ok = parseConversaRequest({ mensagens: [{ eu: false, nome: "Ana", texto: "oi" }], perfil: PERFIL });
  assert.equal(ok.success, true);
  assert.equal(parseConversaRequest({ mensagens: [] }).success, false);
  const muitas = Array.from({ length: 41 }, () => ({ eu: false, nome: "Ana", texto: "oi" }));
  assert.equal(parseConversaRequest({ mensagens: muitas }).success, false);
  const soEu = parseConversaRequest({ mensagens: [{ eu: true, nome: "Jef", texto: "oi" }] });
  assert.equal(soEu.success, false);
});
