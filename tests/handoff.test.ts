import test from "node:test";
import assert from "node:assert/strict";
import { buildHandoffCard, conversationLines, handoffIsReady, handoffItem, MAX_HANDOFF_LINES } from "../lib/handoff.ts";

const item = (kind: "fato" | "duvida" | "acao", text: string, source = text) => ({
  ...handoffItem(text, text.length, kind),
  source,
});

test("passagem de bastão: agrupa por tipo e preserva a origem de cada item", () => {
  const card = buildHandoffCard({
    items: [item("fato", "A viatura foi liberada"), item("acao", "Enviar o relatório até 18h")],
    responsavel: "Cabo Almeida",
    proximaAcao: "Conferir o relatório",
  });
  assert.equal(
    card,
    [
      "PASSAGEM DE BASTÃO",
      "Fatos confirmados\n- A viatura foi liberada",
      "Próximas ações\n- Enviar o relatório até 18h",
      "Responsável: Cabo Almeida",
      "Próxima ação: Conferir o relatório",
      "Confira cada item com a conversa original antes de enviar.",
    ].join("\n\n"),
  );
});

test("passagem de bastão: mostra o trecho original quando o texto foi reescrito", () => {
  const card = buildHandoffCard({
    items: [item("duvida", "Falta a assinatura do chefe", "não sei se o chefe assinou ainda")],
    responsavel: "",
    proximaAcao: "",
  });
  assert.match(
    card,
    /Dúvidas em aberto\n- Falta a assinatura do chefe\n {2}origem: "não sei se o chefe assinou ainda"/,
  );
});

test("passagem de bastão: sem itens não há cartão", () => {
  assert.equal(buildHandoffCard({ items: [], responsavel: "Alguém", proximaAcao: "" }), "");
  assert.equal(handoffIsReady({ items: [], responsavel: "", proximaAcao: "" }), false);
  assert.equal(handoffIsReady({ items: [item("fato", "ok")], responsavel: "", proximaAcao: "" }), true);
});

test("passagem de bastão: cada linha da conversa vira um candidato, com limite", () => {
  assert.deepEqual(conversationLines("  bom dia\n\n- troca às 7h  \n"), ["bom dia", "- troca às 7h"]);
  const many = Array.from({ length: MAX_HANDOFF_LINES + 5 }, (_, index) => `linha ${index}`).join("\n");
  assert.equal(conversationLines(many).length, MAX_HANDOFF_LINES);
});

test("passagem de bastão: itens com identificadores diferentes para a mesma linha", () => {
  assert.notEqual(handoffItem("troca às 7h", 0).id, handoffItem("troca às 7h", 1).id);
});
