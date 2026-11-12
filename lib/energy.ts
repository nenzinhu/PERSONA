// Modo pouca energia: dizer a disponibilidade real sem inventar justificativas.
export const ENERGY_AVAILABILITY = [
  {
    id: "agora",
    label: "Consigo resolver agora",
    hint: "Você tem disponibilidade para isso neste momento.",
  },
  {
    id: "depois",
    label: "Preciso de tempo",
    hint: "Você pode assumir, mas não agora.",
  },
  {
    id: "nao-assumo",
    label: "Não consigo assumir",
    hint: "Você não vai assumir esta demanda.",
  },
] as const;

export type EnergyAvailabilityId = (typeof ENERGY_AVAILABILITY)[number]["id"];

export interface EnergyDraft {
  disponibilidade: EnergyAvailabilityId;
  assunto: string;
  quando: string;
  limite: string;
}

export const MAX_ENERGY_FIELD = 160;

const clean = (value: string) => value.trim().replace(/\s+/g, " ");

/**
 * Monta a mensagem apenas com o que foi escolhido: disponibilidade, assunto e,
 * quando fizer sentido, o prazo do retorno e o limite real. Nenhuma justificativa
 * é criada pelo app.
 */
export function buildEnergyMessage(draft: EnergyDraft): string {
  const disponibilidade = ENERGY_AVAILABILITY.find(({ id }) => id === draft.disponibilidade) ?? ENERGY_AVAILABILITY[0];
  const assunto = clean(draft.assunto);
  const quando = clean(draft.quando);
  const limite = clean(draft.limite);

  const parts: string[] = [];
  if (disponibilidade.id === "agora") {
    parts.push(assunto ? `Consigo resolver ${assunto} agora.` : "Consigo resolver isso agora.");
  } else if (disponibilidade.id === "depois") {
    parts.push(assunto ? `Preciso de tempo para ${assunto}.` : "Preciso de tempo para isso.");
    if (quando) parts.push(`Consigo retomar ${quando}.`);
  } else {
    parts.push(assunto ? `Não consigo assumir ${assunto}.` : "Não consigo assumir isso.");
    if (quando) parts.push(`Se ainda estiver em aberto depois de ${quando}, me chama.`);
  }
  if (limite) parts.push(`O meu limite é ${limite}.`);

  return parts.join(" ");
}

/** Uma mensagem só faz sentido quando o assunto ou o limite foi informado. */
export function energyIsReady(draft: EnergyDraft) {
  return Boolean(clean(draft.assunto) || clean(draft.limite));
}
