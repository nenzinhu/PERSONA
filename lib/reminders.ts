// Lembretes locais das pendências confirmadas: o que venceu, o que vence hoje.
import type { SavedPending } from "./decision-local.ts";

export type DueState = "vencido" | "hoje" | "proximos";

export const DUE_SOON_DAYS = 2;

/** Data local no formato AAAA-MM-DD (o que o input date usa). */
export function todayISO(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DAY_MS = 86_400_000;
const parse = (iso: string) => new Date(`${iso}T12:00:00`);

export function isValidDueDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parse(value);
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value);
}

/** Estado do vencimento em relação a hoje; `null` quando não há data válida. */
export function dueState(vencimento: string | undefined, today: string): DueState | null {
  if (!vencimento || !isValidDueDate(vencimento)) return null;
  const diffDays = Math.round((parse(vencimento).getTime() - parse(today).getTime()) / DAY_MS);
  if (diffDays < 0) return "vencido";
  if (diffDays === 0) return "hoje";
  if (diffDays <= DUE_SOON_DAYS) return "proximos";
  return null;
}

export function dueLabel(vencimento: string | undefined, today: string): string {
  const state = dueState(vencimento, today);
  if (!vencimento || !isValidDueDate(vencimento)) return "";
  const formatted = parse(vencimento).toLocaleDateString("pt-BR");
  if (state === "vencido") return `Venceu em ${formatted}`;
  if (state === "hoje") return "Vence hoje";
  const diffDays = Math.round((parse(vencimento).getTime() - parse(today).getTime()) / DAY_MS);
  if (state === "proximos") return `Vence em ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  return `Vence em ${formatted}`;
}

/** Atualiza a data de vencimento; string vazia remove a data. */
export function setPendingDue(item: SavedPending, vencimento: string): SavedPending {
  if (!vencimento) {
    const { vencimento: _removed, ...rest } = item;
    return rest;
  }
  if (!isValidDueDate(vencimento)) throw new Error("Data de vencimento inválida.");
  return { ...item, vencimento };
}

/** Pendências abertas que venceram ou vencem até `DUE_SOON_DAYS` dias, na ordem do vencimento. */
export function dueReminders(items: SavedPending[], today: string): SavedPending[] {
  return items
    .filter((item) => item.status === "aberto" && dueState(item.vencimento, today) !== null)
    .sort((a, b) => (a.vencimento ?? "").localeCompare(b.vencimento ?? ""));
}

export function dueSummary(items: SavedPending[], today: string) {
  let vencidos = 0;
  let hoje = 0;
  for (const item of items) {
    if (item.status !== "aberto") continue;
    const state = dueState(item.vencimento, today);
    if (state === "vencido") vencidos += 1;
    if (state === "hoje") hoje += 1;
  }
  return { vencidos, hoje };
}
