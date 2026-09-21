// Traços de personalidade que moldam o tom da resposta.
// ("tipo" da lista original era tradução de "kind" → usamos "gentil".)

export const POSITIVE_TRAITS = [
  "aceitando",
  "adaptável",
  "afável",
  "mente aberta",
  "carismático",
  "compassivo",
  "competente",
  "confiante",
  "agradável",
  "corajoso",
  "criativo",
  "determinado",
  "discreto",
  "dirigido",
  "empático",
  "entusiasmado",
  "exuberante",
  "justo",
  "amigável",
  "gregário",
  "útil",
  "honesto",
  "humilde",
  "independente",
  "perspicaz",
  "inteligente",
  "gentil",
  "leal",
  "consciente",
  "otimista",
  "paciente",
  "persistente",
  "preciso",
  "confiável",
  "responsável",
  "sociável",
  "simpático",
  "tolerante",
  "compreensivo",
];

export const NEGATIVE_TRAITS = [
  "agressivo",
  "apático",
  "argumentativo",
  "arrogante",
  "grosseiro",
  "mandão",
  "insensível",
  "pretensioso",
  "covarde",
  "desonesto",
  "desleal",
  "desrespeitoso",
  "exigente",
  "esquecido",
  "ambicioso",
  "impaciente",
  "impulsivo",
  "indeciso",
  "ciumento",
  "preguiçoso",
  "malicioso",
  "manipulador",
  "detestável",
  "pessimista",
  "irresponsável",
  "rígido",
  "rude",
  "sarcástico",
  "egocêntrico",
  "egoísta",
  "desleixado",
  "sorrateiro",
  "avarento",
  "impensado",
  "incerto",
  "hostil",
  "imprevisível",
  "vulgar",
];

export const MAX_TRAITS = 6;

const ALL = new Set([...POSITIVE_TRAITS, ...NEGATIVE_TRAITS]);

export function sanitizeTraits(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  return [...new Set(x.map(String).filter((t) => ALL.has(t)))].slice(0, MAX_TRAITS);
}

export function traitsInstruction(traits: string[]): string {
  if (!traits.length) return "";
  const neg = traits.filter((t) => NEGATIVE_TRAITS.includes(t));
  return [
    `Personalidade nesta resposta: ${traits.join(", ")}. Deixe isso aparecer no tom e na escolha das palavras, sem citar os traços.`,
    neg.length
      ? "Os traços negativos aparecem só no jeito de falar; sem xingamento pesado, ameaça ou preconceito."
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}
