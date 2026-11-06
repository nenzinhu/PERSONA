import test from "node:test";
import assert from "node:assert/strict";
import { buildServiceOrderReport, isVehicleNumber } from "../lib/service-order.ts";

test("o informe tem título com etapa e um único parágrafo", () => {
  assert.equal(
    buildServiceOrderReport({
      ordem: "Operação Bairro Seguro",
      fase: "encerramento",
      local: "Praça Central",
      viatura: "0042",
      dataHora: "",
      relato: "A equipe realizou rondas.\nSem alterações.",
      observacoes: "",
    }),
    "CUMPRIMENTO DE ORDEM DE SERVIÇO (FINALIZADO)\n\nOrdem de serviço Operação Bairro Seguro, no local Praça Central, com a viatura PM-0042. A equipe realizou rondas. Sem alterações.",
  );
});

test("o prefixo PM aceita exatamente quatro dígitos, inclusive zeros à esquerda", () => {
  assert.equal(isVehicleNumber("0042"), true);
  for (const invalid of ["", "123", "12345", "12a4", "PM-0042"]) {
    assert.equal(isVehicleNumber(invalid), false);
  }
});
