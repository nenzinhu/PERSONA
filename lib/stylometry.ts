// Mede o jeito de escrever a partir das suas mensagens reais (tudo local, sem IA):
// usado para calibrar o humanizador (#10) e dar a nota "parece eu" (#7).

import { ABBREVIATIONS, type HumanizeOptions } from "./humanize.ts";

/** Mínimo de exemplos para a calibração e a nota fazerem sentido. */
export const MIN_EXAMPLES = 3;

/** Proporções de 0 a 1; `null` quando os textos não têm nada para medir naquele traço. */
export interface Fingerprint {
  samples: number;
  abbreviation: number | null;
  noAccent: number | null;
  noFinalPeriod: number | null;
  lowerStart: number | null;
  kkk: number | null;
  avgWords: number;
  emojis: number;
}

// "que" → "q" aparece até em quem não abrevia nada; distorce a medida.
const ABBR = ABBREVIATIONS.filter(([full]) => full !== "que");
const FULL_FORMS = [...new Set(ABBR.map(([full]) => full))];
const SHORT_FORMS = [...new Set(ABBR.map(([, short]) => short))];

// Só pares em que a forma sem acento não é outra palavra válida ("esta", "e").
const ACCENT_PAIRS: [string, string][] = [
  ["não", "nao"],
  ["você", "voce"],
  ["vocês", "voces"],
  ["também", "tambem"],
  ["então", "entao"],
  ["já", "ja"],
  ["até", "ate"],
  ["tão", "tao"],
  ["são", "sao"],
  ["aí", "ai"],
];

function escapeRe(x: string) {
  return x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countWords(text: string, words: string[]): number {
  let total = 0;
  for (const word of words) {
    const re = new RegExp(`(^|[^\\p{L}])${escapeRe(word)}(?=[^\\p{L}]|$)`, "giu");
    total += text.match(re)?.length ?? 0;
  }
  return total;
}

function ratio(hits: number, misses: number): number | null {
  return hits + misses === 0 ? null : hits / (hits + misses);
}

const KKK = /(^|[^\p{L}])k{3,}(?=[^\p{L}]|$)/giu;
const OTHER_LAUGH = /(^|[^\p{L}])(?:(?:ha){2,}h?|(?:he){2,}|rs(?:rs)*)(?=[^\p{L}]|$)/giu;
const EMOJI = /\p{Extended_Pictographic}/gu;

export function fingerprint(texts: string[]): Fingerprint {
  const msgs = texts.map((t) => t.trim()).filter(Boolean);
  let short = 0;
  let full = 0;
  let unaccented = 0;
  let accented = 0;
  let endAlnum = 0;
  let endPeriod = 0;
  let lower = 0;
  let upper = 0;
  let kkk = 0;
  let otherLaugh = 0;
  let words = 0;
  let emojis = 0;

  for (const msg of msgs) {
    short += countWords(msg, SHORT_FORMS);
    full += countWords(msg, FULL_FORMS);
    unaccented += countWords(
      msg,
      ACCENT_PAIRS.map(([, plain]) => plain),
    );
    accented += countWords(
      msg,
      ACCENT_PAIRS.map(([withAccent]) => withAccent),
    );

    const withoutEmoji = msg.replace(EMOJI, "").trimEnd();
    if (/[.]$/.test(withoutEmoji) && !/\.\.$/.test(withoutEmoji)) endPeriod++;
    else if (/[\p{L}\p{N}]$/u.test(withoutEmoji)) endAlnum++;

    const firstLetter = msg.match(/\p{L}/u)?.[0];
    if (firstLetter && msg.indexOf(firstLetter) === msg.search(/\S/)) {
      if (firstLetter !== firstLetter.toUpperCase()) lower++;
      else if (firstLetter !== firstLetter.toLowerCase()) upper++;
    }

    kkk += msg.match(KKK)?.length ?? 0;
    otherLaugh += msg.match(OTHER_LAUGH)?.length ?? 0;
    words += msg.split(/\s+/).filter(Boolean).length;
    emojis += msg.match(EMOJI)?.length ?? 0;
  }

  const n = msgs.length;
  return {
    samples: n,
    abbreviation: ratio(short, full),
    noAccent: ratio(unaccented, accented),
    noFinalPeriod: ratio(endAlnum, endPeriod),
    lowerStart: ratio(lower, upper),
    kkk: ratio(kkk, otherLaugh),
    avgWords: n ? words / n : 0,
    emojis: n ? emojis / n : 0,
  };
}

export interface Calibration {
  humanize: Partial<Pick<HumanizeOptions, "abbreviation" | "typoRate" | "casual" | "kkk">>;
  emoji: boolean;
}

/** Converte o fingerprint nos controles; traço sem dado fica de fora (o usuário mantém o valor atual). */
export function calibrate(fp: Fingerprint): Calibration {
  const humanize: Calibration["humanize"] = {};
  if (fp.abbreviation !== null) humanize.abbreviation = Math.round(fp.abbreviation * 100);
  // Tirar acento é o principal erro do humanizador; 100% sem acento ≈ teto de 20%.
  if (fp.noAccent !== null) humanize.typoRate = Math.round(fp.noAccent * 20);
  if (fp.noFinalPeriod !== null || fp.lowerStart !== null) {
    humanize.casual = (fp.noFinalPeriod ?? 0) >= 0.5 || (fp.lowerStart ?? 0) >= 0.5;
  }
  if (fp.kkk !== null) humanize.kkk = fp.kkk >= 0.5;
  return { humanize, emoji: fp.emojis >= 0.3 };
}

type Feature = {
  weight: number;
  distance: (text: Fingerprint, me: Fingerprint) => number | null;
  hint: (text: Fingerprint, me: Fingerprint) => string;
};

function diff(a: number | null, b: number | null): number | null {
  return a === null || b === null ? null : Math.abs(a - b);
}

const FEATURES: Feature[] = [
  {
    weight: 25,
    distance: (t, m) => diff(t.abbreviation, m.abbreviation),
    hint: (t, m) =>
      (t.abbreviation ?? 0) < (m.abbreviation ?? 0) ? "abrevia menos que você (vc, pq, tb…)" : "abrevia mais que você",
  },
  {
    weight: 15,
    distance: (t, m) => diff(t.noAccent, m.noAccent),
    hint: (t, m) =>
      (t.noAccent ?? 0) < (m.noAccent ?? 0) ? "acentua mais que você (nao, voce…)" : "tira acento mais que você",
  },
  {
    weight: 15,
    distance: (t, m) => diff(t.noFinalPeriod, m.noFinalPeriod),
    hint: (t, m) =>
      (t.noFinalPeriod ?? 0) < (m.noFinalPeriod ?? 0)
        ? "tem ponto final, e você quase não usa"
        : "você costuma usar ponto final",
  },
  {
    weight: 10,
    distance: (t, m) => diff(t.lowerStart, m.lowerStart),
    hint: (t, m) =>
      (t.lowerStart ?? 0) < (m.lowerStart ?? 0)
        ? "começa com maiúscula, e você começa minúsculo"
        : "você costuma começar com maiúscula",
  },
  {
    weight: 20,
    distance: (t, m) => {
      if (!m.avgWords) return null;
      return Math.min(1, Math.abs(Math.log(Math.max(1, t.avgWords) / Math.max(1, m.avgWords))) / Math.log(3));
    },
    hint: (t, m) => (t.avgWords > m.avgWords ? "mais longa que as suas mensagens" : "mais curta que as suas mensagens"),
  },
  {
    weight: 10,
    distance: (t, m) => Math.min(1, Math.abs(t.emojis - m.emojis)),
    hint: (t, m) => (t.emojis > m.emojis ? "tem mais emoji que você usa" : "você costuma usar emoji"),
  },
  {
    weight: 5,
    distance: (t, m) => diff(t.kkk, m.kkk),
    hint: (t, m) =>
      (t.kkk ?? 0) < (m.kkk ?? 0) ? "ri com haha/rs, e você usa kkkk" : "ri com kkkk, e você usa haha/rs",
  },
];

export interface StyleScore {
  /** 0–100: quanto o texto parece com as suas mensagens. */
  score: number;
  /** Até 3 motivos, do que mais pesa para o que menos pesa. */
  hints: string[];
}

export function styleScore(text: string, me: Fingerprint): StyleScore {
  const t = fingerprint([text]);
  let weights = 0;
  let distance = 0;
  const misses: { cost: number; hint: string }[] = [];
  for (const feature of FEATURES) {
    const d = feature.distance(t, me);
    if (d === null) continue;
    weights += feature.weight;
    distance += feature.weight * d;
    if (d >= 0.4) misses.push({ cost: feature.weight * d, hint: feature.hint(t, me) });
  }
  const score = weights ? Math.round(100 * (1 - distance / weights)) : 50;
  return {
    score: Math.max(0, Math.min(100, score)),
    hints: misses
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 3)
      .map((m) => m.hint),
  };
}
