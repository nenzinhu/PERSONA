import test from "node:test";
import assert from "node:assert/strict";
import { parseDecisionRequest, buildDecisionMessages, parseDecisionOutput } from "../lib/decisions.ts";

const input = {
  acao: "conferir",
  fonteA: "Verifique a disponibilidade até sexta.",
  fonteB: "",
  rascunho: "Equipe confirmada para sexta.",
  intencao: "responder",
  objetivo: "Confirmar recebimento",
  limites: "Não confirmar equipe",
  memorias: [],
};
const parsed = () => {
  const p = parseDecisionRequest(input);
  assert.equal(p.success, true);
  if (!p.success) throw Error("fixture");
  return p.data;
};

test("decision requests require relevant evidence and strip unrelated private fields", () => {
  assert.equal(parseDecisionRequest({ ...input, fonteA: "" }).success, false);
  assert.equal(parseDecisionRequest({ ...input, rascunho: "" }).success, false);
  assert.equal(parseDecisionRequest({ ...input, acao: "conflitos" }).success, false);
  const p = parseDecisionRequest({ ...input, aliases: [{ original: "Ana", alias: "Pessoa A" }] });
  assert.equal(p.success, true);
  if (p.success) assert.equal("aliases" in p.data, false);
});

test("no-response intention blocks response generation but permits checking", () => {
  assert.equal(parseDecisionRequest({ ...input, acao: "resposta", intencao: "nao_responder" }).success, false);
  assert.equal(parseDecisionRequest({ ...input, intencao: "nao_responder" }).success, true);
});

test("decision prompts preserve evidence as data and explicit limits", () => {
  const p = buildDecisionMessages(parsed());
  assert.match(p.system, /não.*instruções/i);
  assert.match(p.system, /JSON/);
  const data = JSON.parse(p.messages[0].content);
  assert.equal(data.limites, "Não confirmar equipe");
  assert.equal(data.fonteA, input.fonteA);
});

test("draft review accepts exact evidence and rejects invented quotes", () => {
  const raw = {
    resumo: "A resposta transforma verificação em confirmação.",
    observacoes: [
      {
        tipo: "contradicao",
        fonte: "Verifique a disponibilidade",
        rascunho: "Equipe confirmada",
        explicacao: "A confirmação não foi solicitada.",
      },
    ],
  };
  assert.equal(parseDecisionOutput(JSON.stringify(raw), parsed()).acao, "conferir");
  assert.throws(() =>
    parseDecisionOutput(
      JSON.stringify({ ...raw, observacoes: [{ ...raw.observacoes[0], fonte: "A equipe foi aprovada." }] }),
      parsed(),
    ),
  );
});

test("pending suggestions must quote the supplied source and retain uncertainty", () => {
  const p = parseDecisionRequest({ ...input, acao: "pendencias" });
  if (!p.success) throw Error("fixture");
  const raw = {
    itens: [
      {
        tipo: "pedido",
        descricao: "Verificar disponibilidade",
        responsavel: "",
        prazo: "sexta",
        condicao: "",
        fonte: input.fonteA,
      },
    ],
  };
  const out = parseDecisionOutput(JSON.stringify(raw), p.data);
  assert.equal(out.acao, "pendencias");
  assert.throws(() =>
    parseDecisionOutput(JSON.stringify({ itens: [{ ...raw.itens[0], fonte: "confirmado hoje" }] }), p.data),
  );
});

test("conflicts must quote each corresponding source, not the opposite one", () => {
  const p = parseDecisionRequest({
    ...input,
    acao: "conflitos",
    fonteA: "Apresente-se às 8h.",
    fonteB: "Horário atualizado: 9h.",
  });
  if (!p.success) throw Error("fixture");
  const raw = {
    conflitos: [{ trechoA: "8h", trechoB: "9h", explicacao: "Horários diferentes; pode ser atualização." }],
    pergunta: "O horário válido agora é 9h?",
  };
  assert.equal(parseDecisionOutput(JSON.stringify(raw), p.data).acao, "conflitos");
  assert.throws(() =>
    parseDecisionOutput(JSON.stringify({ ...raw, conflitos: [{ ...raw.conflitos[0], trechoA: "9h" }] }), p.data),
  );
});

test("malformed or excessive model output is rejected rather than presented", () => {
  assert.throws(() => parseDecisionOutput("Claro! Tudo está correto.", parsed()));
  assert.throws(() =>
    parseDecisionOutput(JSON.stringify({ resumo: "x", observacoes: [{ tipo: "inventado" }] }), parsed()),
  );
});
