import test from "node:test";
import assert from "node:assert/strict";
import { readWithoutContext } from "../lib/plain-read.ts";

const gapIds = (text: string) => readWithoutContext(text).gaps.map((check) => check.id);

test("leitura sem contexto: pedido com prazo deixa menos perguntas", () => {
  const { gaps } = readWithoutContext("Envie o relatório até sexta, por favor.");
  assert.deepEqual(gaps, []);
});

test("leitura sem contexto: texto solto aponta ação, prazo e o que ficou em aberto", () => {
  const ids = gapIds("Sobre isso, a gente vê depois quando der.");
  assert.deepEqual(ids, ["acao", "prazo", "referencia", "aberto"]);
});

test("leitura sem contexto: cada lacuna vem com pergunta e detalhe do que foi encontrado", () => {
  const { checks } = readWithoutContext("Manda a planilha na segunda.");
  const prazo = checks.find((check) => check.id === "prazo");
  assert.equal(prazo?.ok, true);
  assert.match(prazo?.detail ?? "", /segunda/);
  const referencia = checks.find((check) => check.id === "referencia");
  assert.equal(referencia?.ok, true);
  assert.match(referencia?.question ?? "", /só recebeu/);
});

test("leitura sem contexto: texto vazio não inventa achados", () => {
  const { checks, gaps } = readWithoutContext("   ");
  assert.equal(checks.length, 4);
  assert.equal(
    gaps.some((check) => check.id === "referencia"),
    false,
  );
  assert.equal(
    gaps.some((check) => check.id === "aberto"),
    false,
  );
  assert.equal(
    gaps.some((check) => check.id === "acao"),
    true,
  );
});

test("leitura sem contexto: não repete a mesma palavra encontrada", () => {
  const { checks } = readWithoutContext("Isso, isso e isso: a parada é aquilo lá.");
  const referencia = checks.find((check) => check.id === "referencia");
  assert.equal(referencia?.detail, "Palavras que só fazem sentido com o histórico: isso, a parada, aquilo, lá.");
});
