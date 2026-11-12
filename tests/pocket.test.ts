import test from "node:test";
import assert from "node:assert/strict";
import { buildPocketCard, pocketIsReady, splitPocketList, MAX_POCKET_ITEMS } from "../lib/pocket.ts";

test("cartão de bolso: monta as três partes na ordem", () => {
  assert.equal(
    buildPocketCard({
      dizer: "Que eu preciso de mais prazo\nQue não concordo com o horário",
      perguntar: "Quem assume o plantão de sábado?",
      limite: "Não fico depois das 19h.",
    }),
    [
      "CARTÃO DE BOLSO",
      "O que preciso dizer\n- Que eu preciso de mais prazo\n- Que não concordo com o horário",
      "O que preciso perguntar\n- Quem assume o plantão de sábado?",
      "Meu limite\nNão fico depois das 19h.",
    ].join("\n\n"),
  );
});

test("cartão de bolso: só aparece o que foi preenchido", () => {
  assert.equal(
    buildPocketCard({ dizer: "", perguntar: "", limite: "Não falo de futebol." }),
    "CARTÃO DE BOLSO\n\nMeu limite\nNão falo de futebol.",
  );
  assert.equal(buildPocketCard({ dizer: "", perguntar: "", limite: "" }), "");
  assert.equal(pocketIsReady({ dizer: "", perguntar: "", limite: "" }), false);
  assert.equal(pocketIsReady({ dizer: "oi", perguntar: "", limite: "" }), true);
});

test("cartão de bolso: aceita linha, ponto e vírgula e marcadores", () => {
  assert.deepEqual(splitPocketList("- um; dois\n\n• três\n* quatro"), ["um", "dois", "três", "quatro"]);
  const many = Array.from({ length: MAX_POCKET_ITEMS + 4 }, (_, index) => `item ${index}`).join("\n");
  assert.equal(splitPocketList(many).length, MAX_POCKET_ITEMS);
});
