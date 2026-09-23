import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_CONVERSATION, parseConversation } from "../lib/whatsapp.ts";
import { buildConversationMessages, parseAgentOutput, SITUATIONS } from "../lib/prompt.ts";
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
    { from: "Ana", text: "vc vem sexta?", hora: "21:03", data: "21/09/2026" },
    { from: "Jef", text: "acho q sim\nmas confirmo dps", hora: "21:05", data: "21/09/2026" },
    { from: "Ana", text: "preciso saber hj", hora: "21:40", data: "21/09/2026" },
  ]);
});

test("parseConversation aceita o formato exportado e linhas simples Nome: texto", () => {
  assert.deepEqual(parseConversation("21/09/2026 21:03 - Ana: oi\nJef: e ai"), [
    { from: "Ana", text: "oi", hora: "21:03", data: "21/09/2026" },
    { from: "Jef", text: "e ai" },
  ]);
});

test("parseConversation normaliza hora AM/PM para 24h", () => {
  assert.deepEqual(parseConversation("[9/21/26, 9:03:12 PM] Ana: oi\n[9:05 AM, 9/22/26] Jef: bom dia"), [
    { from: "Ana", text: "oi", hora: "21:03", data: "9/21/26" },
    { from: "Jef", text: "bom dia", hora: "09:05", data: "9/22/26" },
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

test("buildConversationMessages inclui horários, a hora atual e pede QUANDO MANDAR", () => {
  const { system, messages } = buildConversationMessages({
    mensagens: [
      { eu: true, nome: "Jef", texto: "bora sexta?", hora: "20:10" },
      { eu: false, nome: "Ana", texto: "vou ver", hora: "21:40" },
    ],
    objetivo: "",
    agora: "21:45",
    kind: "casual",
    tracos: [],
    emoji: false,
    perfil: PERFIL,
  });
  assert.match(system, /### QUANDO MANDAR/);
  const last = messages.at(-1)!.content;
  assert.match(last, /\[20:10\] Você: bora sexta\?/);
  assert.match(last, /\[21:40\] Ana: vou ver/);
  assert.match(last, /<<<AGORA>>>\n21:45/);
});

test("buildConversationMessages no modo iniciar pede para puxar assunto, mesmo sem conversa", () => {
  const { system, messages } = buildConversationMessages({
    mensagens: [],
    modo: "iniciar",
    nomeOutro: "Ana",
    objetivo: "",
    kind: "casual",
    tracos: [],
    emoji: false,
    perfil: PERFIL,
  });
  assert.match(system, /puxar assunto|abrir|reabrir/i);
  const last = messages.at(-1)!.content;
  assert.match(last, /<<<PESSOA>>>\nAna/);
  assert.match(last, /\(nenhuma mensagem ainda\)/);
});

test("SITUATIONS tem objetivos prontos para situações difíceis", () => {
  assert.ok(SITUATIONS.length >= 6);
  for (const situation of SITUATIONS) {
    assert.ok(situation.label && situation.objetivo.length > 20 && situation.objetivo.length <= 300);
  }
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
    "### QUANDO MANDAR",
    "agora, ela tá online",
  ].join("\n");
  assert.deepEqual(parseAgentOutput(raw), {
    plano: "reconhecer e propor sábado",
    resposta: "pô foi mal, sábado rola?",
    replicas: [
      { deles: "sábado não dá", voce: "blz, e domingo?" },
      { deles: "rola sim", voce: "fechou entao" },
    ],
    quando: "agora, ela tá online",
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
    quando: "",
  });
});

test("parseAgentOutput sem títulos usa o texto todo como resposta", () => {
  assert.deepEqual(parseAgentOutput("  vou sim, sábado  "), {
    plano: "",
    resposta: "vou sim, sábado",
    replicas: [],
    quando: "",
  });
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

test("parseConversaRequest no modo iniciar aceita conversa vazia com o nome da pessoa", () => {
  assert.equal(parseConversaRequest({ modo: "iniciar", mensagens: [], nomeOutro: "Ana" }).success, true);
  assert.equal(parseConversaRequest({ modo: "iniciar", mensagens: [] }).success, false);
  const soEu = parseConversaRequest({ modo: "iniciar", mensagens: [{ eu: true, nome: "Jef", texto: "oi?" }] });
  assert.equal(soEu.success, true);
  const comHora = parseConversaRequest({
    mensagens: [{ eu: false, nome: "Ana", texto: "oi", hora: "21:03" }],
    agora: "21:10",
  });
  assert.equal(comHora.success, true);
  if (comHora.success) assert.equal(comHora.data.mensagens[0].hora, "21:03");
  assert.equal(parseConversaRequest({ mensagens: [{ eu: false, texto: "oi", hora: "99:99" }] }).success, false);
});
