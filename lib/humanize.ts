// Pós-processamento que deixa o texto com cara de digitado no celular:
// abreviações de internet, erros de digitação controlados por porcentagem
// e pequenas "manias" (sem ponto final, minúscula no começo, kkkk).

export interface HumanizeOptions {
  /** 0–100: chance de trocar cada palavra abreviável (vc, pq, tb...). */
  abbreviation: number;
  /** 0–100: % das palavras elegíveis que recebem um erro de digitação. */
  typoRate: number;
  /** Tira o ponto final das frases e às vezes a maiúscula inicial. */
  casual: boolean;
  /** Troca "haha"/"rs" por "kkkk". */
  kkk: boolean;
  seed: number;
}

export const DEFAULT_HUMANIZE: HumanizeOptions = {
  abbreviation: 50,
  typoRate: 3,
  casual: true,
  kkk: true,
  seed: 1,
};

// Frases vêm antes das palavras soltas ("por que" antes de "que") para casar primeiro.
export const ABBREVIATIONS: [string, string][] = [
  ["fim de semana", "fds"],
  ["por que", "pq"],
  ["porque", "pq"],
  ["por quê", "pq"],
  ["vocês", "vcs"],
  ["você", "vc"],
  ["também", "tb"],
  ["beleza", "blz"],
  ["quando", "qnd"],
  ["mensagem", "msg"],
  ["mensagens", "msgs"],
  ["hoje", "hj"],
  ["obrigado", "obg"],
  ["obrigada", "obg"],
  ["comigo", "cmg"],
  ["contigo", "ctg"],
  ["qualquer", "qlqr"],
  ["tudo", "td"],
  ["muito", "mt"],
  ["muita", "mt"],
  ["nada", "nd"],
  ["agora", "agr"],
  ["demais", "dms"],
  ["depois", "dps"],
  ["valeu", "vlw"],
  ["falou", "flw"],
  ["certeza", "ctz"],
  ["verdade", "vdd"],
  ["mesmo", "msm"],
  ["quem", "qm"],
  ["beijos", "bjs"],
  ["beijo", "bj"],
  ["abraço", "abs"],
  ["abraços", "abs"],
  ["está", "tá"],
  ["estou", "tô"],
  ["estava", "tava"],
  ["estão", "tão"],
  ["para", "pra"],
  ["não é", "né"],
  ["o que", "oq"],
  ["que", "q"],
];

// Vizinhos no teclado QWERTY (o do celular) para erros realistas.
const NEIGHBORS: Record<string, string> = {
  q: "wa",
  w: "qes",
  e: "wrd",
  r: "etf",
  t: "ryg",
  y: "tuh",
  u: "yij",
  i: "uok",
  o: "ipl",
  p: "ol",
  a: "qsz",
  s: "adwx",
  d: "sfec",
  f: "dgrv",
  g: "fhtb",
  h: "gjyn",
  j: "hkum",
  k: "jli",
  l: "kop",
  z: "asx",
  x: "zsc",
  c: "xdv",
  v: "cfb",
  b: "vgn",
  n: "bhm",
  m: "nj",
};

const ACCENTS: Record<string, string> = {
  á: "a",
  à: "a",
  â: "a",
  ã: "a",
  é: "e",
  ê: "e",
  í: "i",
  ó: "o",
  ô: "o",
  õ: "o",
  ú: "u",
  ç: "c",
};

/** PRNG determinístico (mulberry32) para o mesmo seed dar o mesmo resultado. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function escapeRe(x: string) {
  return x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keepCase(original: string, repl: string) {
  if (original[0] && original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    return repl.charAt(0).toUpperCase() + repl.slice(1);
  }
  return repl;
}

export function abbreviate(text: string, level: number, rand: () => number): string {
  if (level <= 0) return text;
  const p = Math.min(level, 100) / 100;
  let out = text;
  for (const [full, short] of ABBREVIATIONS) {
    // \b não funciona com acentos, então usamos limites manuais.
    const re = new RegExp(`(^|[^\\p{L}])(${escapeRe(full)})(?=[^\\p{L}]|$)`, "giu");
    // "que" → "q" é agressivo; só em nível alto.
    const pp = full === "que" ? Math.max(0, p - 0.4) : p;
    out = out.replace(re, (_m, pre: string, word: string) => (rand() < pp ? pre + keepCase(word, short) : pre + word));
  }
  return out;
}

function typoWord(word: string, rand: () => number): string {
  const lower = word.toLowerCase();
  const accented = [...lower].some((c) => c in ACCENTS);
  const r = rand();
  // Tirar acento é o "erro" mais comum no celular, então tem prioridade.
  if (accented && r < 0.45) {
    return [...word]
      .map((c) =>
        ACCENTS[c.toLowerCase()] ? (c === c.toUpperCase() ? ACCENTS[c.toLowerCase()].toUpperCase() : ACCENTS[c]) : c,
      )
      .join("");
  }
  const chars = [...word];
  const i = 1 + Math.floor(rand() * (chars.length - 2)); // nunca mexe na 1ª letra
  const kind = rand();
  if (kind < 0.3 && i < chars.length - 1) {
    [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]]; // troca vizinhas: "qeu"
  } else if (kind < 0.55) {
    chars.splice(i, 1); // come uma letra: "tmbem"
  } else if (kind < 0.75) {
    chars.splice(i, 0, chars[i]); // letra dobrada: "entt"
  } else {
    const n = NEIGHBORS[chars[i].toLowerCase()];
    if (n) chars[i] = n[Math.floor(rand() * n.length)]; // tecla do lado: "rambem"
  }
  return chars.join("");
}

export function addTypos(text: string, rate: number, rand: () => number): string {
  if (rate <= 0) return text;
  const p = Math.min(rate, 100) / 100;
  // Só palavras com 4+ letras, sem números/links.
  return text.replace(/(https?:\/\/\S+)|(\p{L}{4,})/gu, (m, url: string | undefined) => {
    if (url) return m;
    return rand() < p ? typoWord(m, rand) : m;
  });
}

export function casualize(text: string, rand: () => number): string {
  const lines = text.split("\n").map((line) => {
    let l = line.trimEnd();
    // Remove ponto final (mantém ? e !)
    l = l
      .replace(/\.(\s|$)/g, (_m, sp: string) => (rand() < 0.7 ? (sp === "" ? "" : " ") : "." + sp))
      .replace(/ {2,}/g, " ");
    if (rand() < 0.5) l = l.charAt(0).toLowerCase() + l.slice(1);
    return l.trimEnd();
  });
  return lines.join("\n");
}

export function laughs(text: string, rand: () => number): string {
  return text.replace(/\b(?:(?:ha){2,}h?|(?:he){2,}|rs(?:rs)*|kk+)\b/gi, () => "k".repeat(4 + Math.floor(rand() * 5)));
}

/** Remove vícios típicos de IA que denunciam o texto. */
export function stripAiTells(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^#+\s*/gm, "")
    .replace(/\s*—\s*/g, ", ")
    .replace(/^"(.*)"$/s, "$1")
    .trim();
}

export function humanize(text: string, opts: HumanizeOptions): string {
  const rand = rng(opts.seed);
  let out = stripAiTells(text);
  if (opts.kkk) out = laughs(out, rand);
  out = abbreviate(out, opts.abbreviation, rand);
  if (opts.casual) out = casualize(out, rand);
  out = addTypos(out, opts.typoRate, rand);
  return out;
}
