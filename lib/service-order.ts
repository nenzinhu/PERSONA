export const SERVICE_ORDER_PHASES = [
  { id: "inicio", label: "Iniciando", reportLabel: "INICIANDO" },
  { id: "durante", label: "Durante", reportLabel: "DURANTE" },
  { id: "encerramento", label: "Finalizado", reportLabel: "FINALIZADO" },
] as const;

export interface ServiceOrderDraft {
  ordem: string;
  fase: (typeof SERVICE_ORDER_PHASES)[number]["id"];
  dataHora: string;
  local: string;
  viatura: string;
  relato: string;
  observacoes: string;
}

export function isVehicleNumber(value: string) {
  return /^[0-9]{4}$/.test(value);
}

export function buildServiceOrderReport(draft: ServiceOrderDraft) {
  const phase = SERVICE_ORDER_PHASES.find(({ id }) => id === draft.fase) ?? SERVICE_ORDER_PHASES[0];
  const title = `CUMPRIMENTO DE ORDEM DE SERVIÇO (${phase.reportLabel})`;
  const date = new Date(draft.dataHora);
  const details = [
    draft.ordem.trim() && `Ordem de serviço ${draft.ordem.trim()}`,
    draft.local.trim() && `no local ${draft.local.trim()}`,
    isVehicleNumber(draft.viatura) && `com a viatura PM-${draft.viatura}`,
    Number.isFinite(date.getTime()) && `em ${date.toLocaleString("pt-BR")}`,
  ].filter(Boolean);

  const paragraph = [details.length && details.join(", "), draft.relato, draft.observacoes]
    .filter((text): text is string => typeof text === "string" && Boolean(text.trim()))
    .map((text) => {
      const sentence = text.trim().replace(/\s+/g, " ");
      return /[.!?…]$/.test(sentence) ? sentence : sentence + ".";
    })
    .join(" ");

  return paragraph ? title + "\n\n" + paragraph : title;
}

type PhaseFields = Pick<ServiceOrderDraft, "dataHora" | "relato" | "observacoes">;
export type LinkedServiceOrder = ServiceOrderDraft & {
  etapas?: Partial<Record<ServiceOrderDraft["fase"], PhaseFields>>;
};

export function switchServiceOrderPhase(
  draft: LinkedServiceOrder,
  fase: ServiceOrderDraft["fase"],
): LinkedServiceOrder {
  if (fase === draft.fase) return draft;
  const { dataHora, relato, observacoes } = draft;
  return {
    ...draft,
    ...{ dataHora: "", relato: "", observacoes: "" },
    ...draft.etapas?.[fase],
    fase,
    etapas: { ...draft.etapas, [draft.fase]: { dataHora, relato, observacoes } },
  };
}

const numberWord =
  "(?:zero|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzent[oa]s|trezent[oa]s|quatrocent[oa]s|quinhent[oa]s|seiscent[oa]s|setecent[oa]s|oitocent[oa]s|novecent[oa]s|mil|meia)";
const spokenNumber = new RegExp(
  "(?:\\b(?:OS|O\\.S\\.|ordem(?: de serviço)?|viatura|PM|km|quil[oô]metro|hor[aá]rio)\\s*(?:n[º°.]?\\s*)?[-:]?\\s*|(?<!\\p{L})às\\s+)(" +
    numberWord +
    "(?:\\s+(?:e\\s+)?" +
    numberWord +
    ")*)(?!\\p{L})",
  "giu",
);
const writtenNumber = /\d+(?:(?:[:hH.,/-]\d+)+|[hH](?!\p{L}))?/gu;

export function serviceOrderNumbers(text: string) {
  const written = [...text.matchAll(writtenNumber)].map((match) => ({ text: match[0], start: match.index }));
  const spoken = [...text.matchAll(spokenNumber)].map((match) => ({
    text: match[1],
    start: match.index + match[0].length - match[1].length,
  }));
  return [...written, ...spoken].sort((a, b) => a.start - b.start);
}

export interface ServiceOrderRecord extends ServiceOrderDraft {
  updatedAt: string;
}

export const MAX_SERVICE_ORDER_RECORDS = 50;

/** Guarda ou atualiza a OS pelo número, mantendo a etapa mais recente. */
export function upsertServiceOrderRecord(
  list: ServiceOrderRecord[],
  draft: ServiceOrderDraft,
  updatedAt: string,
): ServiceOrderRecord[] {
  const ordem = draft.ordem.trim();
  if (!ordem) throw new Error("Informe a ordem de serviço para guardar.");
  const record: ServiceOrderRecord = { ...draft, ordem, updatedAt };
  return [record, ...list.filter((item) => item.ordem.trim() !== ordem)].slice(0, MAX_SERVICE_ORDER_RECORDS);
}

/** OS que ainda não tiveram o informe de encerramento. */
export function openServiceOrders(list: ServiceOrderRecord[]) {
  return list.filter((item) => item.fase !== "encerramento");
}

export function serviceOrderPhaseLabel(fase: ServiceOrderDraft["fase"]) {
  return SERVICE_ORDER_PHASES.find(({ id }) => id === fase)?.label ?? SERVICE_ORDER_PHASES[0].label;
}
