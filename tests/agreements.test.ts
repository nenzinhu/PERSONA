import test from "node:test";
import assert from "node:assert/strict";
import {
  findAgreements,
  normalizeTerm,
  precisionQuestion,
  upsertAgreement,
  type Agreement,
} from "../lib/agreements.ts";

const acordos: Agreement[] = [
  { id: "mais tarde", termo: "mais tarde", significado: "até 18h do mesmo dia" },
  { id: "está resolvido", termo: "está resolvido", significado: "com o comprovante enviado no grupo" },
];

test("dicionário de acordos: encontra expressões e usa o significado combinado", () => {
  const hits = findAgreements("Te respondo mais tarde. Fica quieto que já está resolvido.", acordos);
  assert.deepEqual(
    hits.map(({ termo, significado }) => [termo, significado]),
    [
      ["mais tarde", "até 18h do mesmo dia"],
      ["está resolvido", "com o comprovante enviado no grupo"],
    ],
  );
});

test("dicionário de acordos: sem acordo registrado nada é inferido", () => {
  const [hit] = findAgreements("Depois eu vejo.", []);
  assert.equal(hit.termo, "depois");
  assert.equal(hit.significado, "");
});

test("dicionário de acordos: respeita limites de palavra e ordem no texto", () => {
  assert.deepEqual(findAgreements("Comprei um logotipo novo.", []), []);
  const hits = findAgreements("Quando der eu confirmo, mas só quando der.", []);
  assert.equal(hits[0].termo, "quando der");
  assert.equal(hits[0].ocorrencias, 2);
});

test("dicionário de acordos: a pergunta de precisão não sugere significado", () => {
  assert.equal(
    precisionQuestion("  Mais   Tarde "),
    "Quando você escreve «mais tarde», isso quer dizer até quando ou em que condição?",
  );
});

test("dicionário de acordos: registrar substitui a mesma expressão e limita o tamanho", () => {
  const first = upsertAgreement([], "Mais Tarde", "até 18h");
  assert.equal(first[0].termo, "mais tarde");
  assert.equal(normalizeTerm("  Mais   Tarde "), "mais tarde");
  const second = upsertAgreement(first, "mais tarde", "até o fim do expediente");
  assert.equal(second.length, 1);
  assert.equal(second[0].significado, "até o fim do expediente");
  assert.equal(upsertAgreement(second, "   ", "algo").length, 1);
  assert.equal(upsertAgreement(second, "logo", "   ").length, 1);
});
