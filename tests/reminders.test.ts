import test from "node:test";
import assert from "node:assert/strict";
import { dueLabel, dueReminders, dueState, dueSummary, isValidDueDate, setPendingDue } from "../lib/reminders.ts";
import type { SavedPending } from "../lib/decision-local.ts";

const item = (id: string, vencimento?: string, status: "aberto" | "concluido" = "aberto"): SavedPending => ({
  id,
  tipo: "compromisso",
  descricao: "Enviar o relatório",
  responsavel: "",
  prazo: "",
  condicao: "",
  fonte: "enviar o relatório até sexta",
  assunto: "turno",
  status,
  confirmadoEm: "2026-11-10T10:00:00.000Z",
  ...(vencimento ? { vencimento } : {}),
});

const TODAY = "2026-11-12";

test("lembretes: o estado do vencimento acompanha a data", () => {
  assert.equal(dueState("2026-11-11", TODAY), "vencido");
  assert.equal(dueState("2026-11-12", TODAY), "hoje");
  assert.equal(dueState("2026-11-14", TODAY), "proximos");
  assert.equal(dueState("2026-11-30", TODAY), null);
  assert.equal(dueState(undefined, TODAY), null);
  assert.equal(dueState("12/11/2026", TODAY), null);
});

test("lembretes: validação de data e texto amigável", () => {
  assert.equal(isValidDueDate("2028-02-29"), true); // 2028 é bissexto
  assert.equal(isValidDueDate("2026-02-29"), false);
  assert.equal(isValidDueDate("2026-11-31"), false);
  assert.equal(isValidDueDate("2026-11-12"), true);
  assert.match(dueLabel("2026-11-10", TODAY), /Venceu em/);
  assert.equal(dueLabel("2026-11-12", TODAY), "Vence hoje");
  assert.equal(dueLabel("2026-11-14", TODAY), "Vence em 2 dias");
  assert.equal(dueLabel("2026-12-25", TODAY), "Vence em 25/12/2026");
});

test("lembretes: só entram pendências abertas com prazo próximo, na ordem", () => {
  const items = [
    item("a", "2026-11-14"),
    item("b", "2026-11-30"),
    item("c", "2026-11-11"),
    item("d", "2026-11-12", "concluido"),
    item("e"),
  ];
  assert.deepEqual(
    dueReminders(items, TODAY).map((entry) => entry.id),
    ["c", "a"],
  );
  assert.deepEqual(dueSummary(items, TODAY), { vencidos: 1, hoje: 0 });
});

test("lembretes: atualizar vencimento valida e permite remover", () => {
  const base = item("a");
  assert.deepEqual(setPendingDue(base, "2026-11-20").vencimento, "2026-11-20");
  assert.equal(setPendingDue(setPendingDue(base, "2026-11-20"), "").vencimento, undefined);
  assert.throws(() => setPendingDue(base, "amanhã"), /inválida/);
});
