import { buildDecisionMessages, parseDecisionOutput, parseDecisionRequest } from "../lib/decisions.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { newCommitments, preservesLockedPhrases } from "../lib/draft-guard.ts";
import { switchServiceOrderPhase, serviceOrderNumbers } from "../lib/service-order.ts";

test("o tom de encerramento e os trechos travados chegam à revisão", () => {
  const input = {
    acao: "resposta",
    fonteA: "Queria voltar.",
    rascunho: "Tô bem como tô.",
    tomEncerramento: "seco",
    trechosProtegidos: ["Tô bem como tô."],
  };
  assert.equal(parseDecisionRequest(input).success, false);
  const parsed = parseDecisionRequest({ ...input, intencao: "encerrar" });
  assert.ok(parsed.success);
  const request = buildDecisionMessages(parsed.data);
  assert.match(request.system, /frase curta e firme/);
  assert.deepEqual(JSON.parse(request.messages[0].content).trechosProtegidos, input.trechosProtegidos);
  assert.throws(() => parseDecisionOutput('{"texto":"Estou bem."}', parsed.data), /trecho protegido/);
  assert.equal(
    parseDecisionOutput('{"texto":"Tô bem como tô. Prefiro seguir em frente."}', parsed.data).acao,
    "resposta",
  );
});

test("sinaliza compromissos novos e ignora hipóteses e promessas já escritas", () => {
  assert.deepEqual(newCommitments("Vou verificar. Se der, envio amanhã. Estará pronto às 18h.", "Vou verificar."), [
    "Estará pronto às 18h.",
  ]);
  assert.deepEqual(newCommitments("Não vou entregar amanhã. Posso confirmar? Eu entrego sexta."), [
    "Eu entrego sexta.",
  ]);
});

test("preserva frases literais na mesma ordem e como ocorrências distintas", () => {
  assert.equal(preservesLockedPhrases("Tudo certo. Vou verificar. Até logo.", ["Vou verificar.", "Até logo."]), true);
  assert.equal(preservesLockedPhrases("Até logo. Vou verificar.", ["Vou verificar.", "Até logo."]), false);
  assert.equal(preservesLockedPhrases("Vou verificar.", ["Vou verificar.", "Vou verificar."]), false);
});

test("mantém dados comuns e recupera o relato de cada etapa", () => {
  const initial = {
    ordem: "OS 123",
    local: "BR-116",
    viatura: "0042",
    fase: "inicio" as const,
    dataHora: "2026-11-06T08:00",
    relato: "Início",
    observacoes: "",
  };
  const during = switchServiceOrderPhase(initial, "durante");
  assert.equal(during.relato, "");
  assert.equal(during.viatura, "0042");
  const back = switchServiceOrderPhase({ ...during, relato: "Em andamento" }, "inicio");
  assert.equal(back.relato, "Início");
  assert.equal(switchServiceOrderPhase(back, "durante").relato, "Em andamento");
});

test("conserva os zeros da viatura e separa os números ditados", () => {
  const text = "OS 123, às 08h30, no km 18, viatura PM-0042.";
  assert.deepEqual(
    serviceOrderNumbers(text).map(({ text }) => text),
    ["123", "08h30", "18", "0042"],
  );
  assert.deepEqual(
    serviceOrderNumbers("Às oito e trinta, quilômetro dezoito, viatura zero zero quatro dois.").map(({ text }) => text),
    ["oito e trinta", "dezoito", "zero zero quatro dois"],
  );
});
