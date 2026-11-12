import test from "node:test";
import assert from "node:assert/strict";
import {
  buildServiceOrderReport,
  isVehicleNumber,
  openServiceOrders,
  serviceOrderPhaseLabel,
  upsertServiceOrderRecord,
} from "../lib/service-order.ts";

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

test("histórico de OS: guarda pelo número e mantém a etapa mais recente", () => {
  const draft = {
    ordem: "0042",
    fase: "inicio" as const,
    dataHora: "",
    local: "Praça Central",
    viatura: "0042",
    relato: "Rondas iniciadas",
    observacoes: "",
  };
  const first = upsertServiceOrderRecord([], draft, "2026-11-12T10:00:00.000Z");
  assert.equal(first.length, 1);
  const second = upsertServiceOrderRecord(
    first,
    { ...draft, fase: "encerramento", relato: "Sem alterações" },
    "2026-11-12T12:00:00.000Z",
  );
  assert.equal(second.length, 1);
  assert.equal(second[0].fase, "encerramento");
  assert.equal(second[0].relato, "Sem alterações");
  assert.throws(() => upsertServiceOrderRecord([], { ...draft, ordem: "  " }, "x"), /Informe a ordem/);
});

test("histórico de OS: só as sem encerramento ficam abertas", () => {
  const base = {
    dataHora: "",
    local: "",
    viatura: "",
    relato: "",
    observacoes: "",
    updatedAt: "2026-11-12T10:00:00.000Z",
  };
  const list = [
    { ...base, ordem: "1", fase: "inicio" as const },
    { ...base, ordem: "2", fase: "encerramento" as const },
    { ...base, ordem: "3", fase: "durante" as const },
  ];
  assert.deepEqual(
    openServiceOrders(list).map((item) => item.ordem),
    ["1", "3"],
  );
  assert.equal(serviceOrderPhaseLabel("durante"), "Durante");
});
