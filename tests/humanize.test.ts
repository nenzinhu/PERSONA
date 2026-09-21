import { test } from "node:test";
import assert from "node:assert/strict";
import { abbreviate, addTypos, humanize, laughs, rng, stripAiTells } from "../lib/humanize.ts";
import { parseWhatsAppExport, toExamples, listSenders } from "../lib/whatsapp.ts";
import { parseDataset, toJsonl } from "../lib/dataset.ts";

test("abrevia 100% das palavras conhecidas e mantém maiúscula", () => {
  const out = abbreviate("Você também vem hoje? Porque está tarde", 100, rng(1));
  assert.equal(out, "Vc tb vem hj? Pq tá tarde");
});

test("abreviação 0% não mexe", () => {
  assert.equal(abbreviate("você também", 0, rng(1)), "você também");
});

test("não abrevia dentro de outra palavra", () => {
  assert.equal(abbreviate("paraquedas tudoemcasa", 100, rng(1)), "paraquedas tudoemcasa");
});

test("erros 0% não mexem e 100% mexem em toda palavra longa", () => {
  const txt = "amanhã vamos conversar melhor sobre isso";
  assert.equal(addTypos(txt, 0, rng(3)), txt);
  const out = addTypos(txt, 100, rng(3));
  assert.notEqual(out, txt);
  assert.equal(out.split(" ").length, txt.split(" ").length);
});

test("erros não quebram links", () => {
  const url = "https://exemplo.com/pagina";
  assert.ok(addTypos(`olha ${url}`, 100, rng(5)).includes(url));
});

test("mesmo seed dá o mesmo resultado", () => {
  const opts = { abbreviation: 60, typoRate: 10, casual: true, kkk: true, seed: 42 };
  const t = "Hahaha você está certo. Também acho isso, mas depois a gente conversa.";
  assert.equal(humanize(t, opts), humanize(t, opts));
});

test("risada vira kkkk e marcas de IA somem", () => {
  assert.match(laughs("hahaha sério", rng(1)), /^k{4,} sério$/);
  assert.equal(stripAiTells("**Claro** — vamos sim"), "Claro, vamos sim");
});

test("lê exportação do WhatsApp e pareia recebida → minha", () => {
  const raw = [
    "21/09/2026 10:15 - Maria: vai na festa?",
    "21/09/2026 10:16 - Maria: sábado",
    "21/09/2026 10:17 - Jeferson: vou sim",
    "e levo o som",
    "[21/09/2026, 10:18:02] Maria: <Mídia oculta>",
    "21/09/2026 10:19 - Maria: boa!",
  ].join("\n");
  const msgs = parseWhatsAppExport(raw);
  assert.deepEqual(listSenders(msgs), ["Maria", "Jeferson"]);
  assert.deepEqual(toExamples(msgs, "Jeferson"), [
    { contexto: "vai na festa?\nsábado", resposta: "vou sim\ne levo o som" },
  ]);
});

test("JSONL exporta e importa de volta", () => {
  const perfil = { nome: "Jef", descricao: "", exemplos: [{ contexto: "oi", resposta: "eae" }] };
  assert.deepEqual(parseDataset(toJsonl(perfil)), perfil.exemplos);
});

test("ignora a mensagem deletada exata e remove pares duplicados", () => {
  const raw = [
    "21/09/2026 10:15 - Maria: mensagem apagada",
    "21/09/2026 10:16 - Maria: mensagem apagada no meio do texto",
    "21/09/2026 10:17 - Maria: oi",
    "21/09/2026 10:18 - Jeferson: oi",
    "21/09/2026 10:19 - Maria: oi",
    "21/09/2026 10:20 - Jeferson: oi",
  ].join("\n");
  const messages = parseWhatsAppExport(raw);
  assert.equal(
    messages.some((message) => message.text === "mensagem apagada"),
    false,
  );
  assert.equal(
    messages.some((message) => message.text.includes("mensagem apagada no meio do texto")),
    true,
  );
  assert.deepEqual(toExamples(messages, "Jeferson"), [
    { contexto: "mensagem apagada no meio do texto\noi", resposta: "oi" },
    { contexto: "oi", resposta: "oi" },
  ]);
});
