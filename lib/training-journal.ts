// Jornada de treino: histórico local das avaliações do simulador.
export interface TrainingEntry {
  id: string;
  date: string;
  situacao: string;
  nota: number | null;
  resumo: string;
}

export const MAX_TRAINING_ENTRIES = 200;

export function addTrainingEntry(list: TrainingEntry[], entry: Omit<TrainingEntry, "id">, id: string): TrainingEntry[] {
  const situacao = entry.situacao.trim().slice(0, 120) || "Sem situação";
  return [{ ...entry, situacao, id }, ...list].slice(0, MAX_TRAINING_ENTRIES);
}

export interface TrainingProgress {
  total: number;
  media: number | null;
  ultima: number | null;
  /** Diferença entre a média das 3 últimas e a das 3 anteriores. */
  tendencia: number | null;
  porSituacao: { situacao: string; total: number; media: number | null }[];
}

const average = (values: number[]) =>
  values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null;

export function trainingProgress(list: TrainingEntry[]): TrainingProgress {
  const notas = list.map((entry) => entry.nota).filter((nota): nota is number => typeof nota === "number");
  const recentes = notas.slice(0, 3);
  const anteriores = notas.slice(3, 6);
  const mediaRecente = average(recentes);
  const mediaAnterior = average(anteriores);

  const groups = new Map<string, number[]>();
  for (const entry of list) {
    if (typeof entry.nota !== "number") continue;
    const key = entry.situacao.trim() || "Sem situação";
    groups.set(key, [...(groups.get(key) ?? []), entry.nota]);
  }

  return {
    total: list.length,
    media: average(notas),
    ultima: notas[0] ?? null,
    tendencia:
      mediaRecente !== null && mediaAnterior !== null ? Math.round((mediaRecente - mediaAnterior) * 10) / 10 : null,
    porSituacao: [...groups.entries()]
      .map(([situacao, values]) => ({ situacao, total: values.length, media: average(values) }))
      .sort((a, b) => b.total - a.total),
  };
}
