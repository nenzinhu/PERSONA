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
