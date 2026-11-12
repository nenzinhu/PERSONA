// Linha do tempo da conversa: só fatos medidos no texto colado, sem interpretação.
import type { ChatMessage } from "./whatsapp.ts";

export interface PersonCount {
  nome: string;
  total: number;
}

export interface ReplyLatency {
  nome: string;
  minutos: number;
  respostas: number;
}

export interface ConversationStats {
  total: number;
  comHorario: number;
  porPessoa: PersonCount[];
  /** Maior intervalo entre duas mensagens seguidas com horário. */
  maiorIntervalo: { minutos: number; de: string; para: string } | null;
  /** Tempo médio de resposta de cada pessoa, quando há horário. */
  respostaMedia: ReplyLatency[];
  primeiraHora: string;
  ultimaHora: string;
}

const toMinutes = (hora: string) => {
  const [hours, minutes] = hora.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatGap = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};

export function formatGapLabel(minutes: number) {
  return formatGap(minutes);
}

/**
 * Mede apenas o que está escrito: quantidade por pessoa, maior silêncio e tempo
 * médio de resposta. Não avalia intenção, humor nem quem "está certo".
 */
export function conversationStats(messages: ChatMessage[]): ConversationStats {
  const porPessoa = new Map<string, number>();
  for (const message of messages) {
    const nome = message.from.trim() || "Sem nome";
    porPessoa.set(nome, (porPessoa.get(nome) ?? 0) + 1);
  }

  const timed = messages.filter((message) => message.hora && /^\d{1,2}:\d{2}$/.test(message.hora));
  let maiorIntervalo: ConversationStats["maiorIntervalo"] = null;
  const latencies = new Map<string, { total: number; count: number }>();

  for (let index = 1; index < timed.length; index += 1) {
    const previous = timed[index - 1];
    const current = timed[index];
    const gap = toMinutes(current.hora!) - toMinutes(previous.hora!);
    if (gap < 0) continue; // conversa que virou o dia: o horário sozinho não permite medir
    if (!maiorIntervalo || gap > maiorIntervalo.minutos) {
      maiorIntervalo = { minutos: gap, de: previous.from, para: current.from };
    }
    if (previous.from !== current.from) {
      const entry = latencies.get(current.from) ?? { total: 0, count: 0 };
      entry.total += gap;
      entry.count += 1;
      latencies.set(current.from, entry);
    }
  }

  const respostaMedia = [...latencies.entries()]
    .map(([nome, entry]) => ({ nome, minutos: Math.round(entry.total / entry.count), respostas: entry.count }))
    .sort((a, b) => b.respostas - a.respostas);

  return {
    total: messages.length,
    comHorario: timed.length,
    porPessoa: [...porPessoa.entries()].map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total),
    maiorIntervalo,
    respostaMedia,
    primeiraHora: timed[0]?.hora ?? "",
    ultimaHora: timed.at(-1)?.hora ?? "",
  };
}
