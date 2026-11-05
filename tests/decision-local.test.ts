import test from "node:test";
import assert from "node:assert/strict";
import { protectText, restoreText, validateAliases, mapContentText } from "../lib/decision-local.ts";
import { confirmPending, changePendingStatus } from "../lib/decision-local.ts";

test("protects longer overlapping names once and restores original text", () => {
  const aliases = [
    { original: "Ana", alias: "Pessoa A" },
    { original: "Ana Silva", alias: "Pessoa B" },
  ];
  const raw = "Ana Silva falou com Ana. Ana Silva volta amanhã.";
  const protectedText = protectText(raw, aliases);
  assert.equal(protectedText, "Pessoa B falou com Pessoa A. Pessoa B volta amanhã.");
  assert.equal(restoreText(protectedText, aliases), raw);
});

test("protects metacharacters literally and does not replace parts of other words", () => {
  const aliases = [
    { original: "Ana", alias: "Pessoa A" },
    { original: "OS (12)", alias: "Código B" },
  ];
  assert.equal(protectText("Anabela e Ana: OS (12).", aliases), "Anabela e Pessoa A: Código B.");
});

test("rejects duplicate or ambiguous aliases and pre-existing aliases", () => {
  assert.throws(() =>
    validateAliases(
      [
        { original: "Ana", alias: "Pessoa A" },
        { original: "Bia", alias: "Pessoa A" },
      ],
      "Ana",
    ),
  );
  assert.throws(() =>
    validateAliases(
      [
        { original: "Ana", alias: "Bia" },
        { original: "Bia", alias: "Pessoa B" },
      ],
      "Ana",
    ),
  );
  assert.throws(() => validateAliases([{ original: "Ana", alias: "Pessoa A" }], "Ana e Pessoa A"));
  assert.throws(() => validateAliases([{ original: "", alias: "Pessoa A" }], "Ana"));
});

test("restores aliases in one pass without cascading into original words", () => {
  assert.equal(
    restoreText("Pessoa A e Pessoa AB", [
      { original: "Ana", alias: "Pessoa A" },
      { original: "Bruna", alias: "Pessoa AB" },
    ]),
    "Ana e Bruna",
  );
});

test("maps content recursively while preserving protocol actions and suggestion types", () => {
  const data = {
    acao: "resposta",
    tipo: "compromisso",
    texto: "Ana",
    itens: [{ fonte: "Ana confirma", tipo: "pedido" }],
  };
  const out = mapContentText(data, (value) => value.replaceAll("Ana", "Pessoa A").replaceAll("pedido", "invalid"));
  assert.equal(out.acao, "resposta");
  assert.equal(out.itens[0].tipo, "pedido");
  assert.equal(out.itens[0].fonte, "Pessoa A confirma");
  assert.equal(data.texto, "Ana");
});

test("saving requires explicit confirmation and a named subject, retaining conditions", () => {
  const item = {
    tipo: "compromisso" as const,
    descricao: "Enviar relação",
    responsavel: "Eu",
    prazo: "sexta",
    condicao: "se houver viatura",
    fonte: "Se houver viatura, envio sexta.",
  };
  assert.throws(() => confirmPending(item, "Plantão", false, "id", "2026-11-04"));
  assert.throws(() => confirmPending(item, " ", true, "id", "2026-11-04"));
  const saved = confirmPending(item, "Plantão", true, "id", "2026-11-04");
  assert.equal(saved.status, "aberto");
  assert.equal(saved.condicao, "se houver viatura");
  assert.equal(saved.assunto, "Plantão");
  assert.equal(changePendingStatus(saved, "concluido").status, "concluido");
  assert.equal(saved.status, "aberto");
});

test("correcting a completed record preserves completion until an explicit reopen", () => {
  const item = {
    tipo: "compromisso" as const,
    descricao: "Enviar relação",
    responsavel: "Eu",
    prazo: "sexta",
    condicao: "",
    fonte: "Envio sexta.",
  };
  const completed = changePendingStatus(confirmPending(item, "Plantão", true, "id", "2026-11-04"), "concluido");
  const edited = confirmPending({ ...item, prazo: "sábado" }, "Plantão", true, "id", "2026-11-05", completed);
  assert.equal(edited.status, "concluido");
  assert.equal(edited.prazo, "sábado");
  assert.equal(changePendingStatus(edited, "aberto").status, "aberto");
});
