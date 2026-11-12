// Leitura sem contexto: olhar o rascunho como quem só recebeu aquele texto.
export interface PlainCheck {
  id: "acao" | "prazo" | "referencia" | "aberto";
  label: string;
  question: string;
  detail: string;
  ok: boolean;
}

// `\b` do JavaScript é ASCII; por isso os limites usam letras e números Unicode.
const START = String.raw`(?<![\p{L}\p{N}])`;
const END = String.raw`(?![\p{L}\p{N}])`;

const ACTION = new RegExp(
  START +
    "(?:pode|poderia|consegue|preciso que|precisamos|me (?:manda|mande|envia|envie|passa|passe|confirma|confirme|avisa|avise)|envie|envia|manda|mande|confirma|confirme|responde|responda|combina|combinamos|favor|por gentileza|aguardo|fico no aguardo|me diz|me diga)" +
    END,
  "giu",
);
const DEADLINE = new RegExp(
  START +
    "(?:hoje|amanh[ãa]|ontem|depois de amanh[ãa]|segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo|semana que vem|pr[óo]xima semana|fim de semana|at[ée]|manh[ãa]|tarde|noite|\\d{1,2}\\s*[h:]\\s*\\d{0,2}|\\d{1,2}\\/\\d{1,2}|dia \\d{1,2})" +
    END,
  "giu",
);
const LOOSE_REFERENCE = new RegExp(
  START +
    "(?:isso|isto|aquilo|aquela|aquele|aquelas|aqueles|a[íi]|l[áa]|nisso|nessa|nesse|disso|desse|dessa|o neg[óo]cio|a parada|o esquema|a coisa)" +
    END,
  "giu",
);
const OPEN_AGREEMENT = new RegExp(
  START +
    "(?:em aberto|a definir|fica para depois|depois a gente v[êe]|quando der|qualquer coisa|sei l[áa]|vamos vendo|a combinar)" +
    END,
  "giu",
);

const found = (text: string, pattern: RegExp) => [...text.matchAll(pattern)].map((match) => match[0]);

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.toLowerCase()))];
}

/**
 * Três perguntas fixas sobre o próprio texto. Nada é inferido sobre quem recebe:
 * só o que está escrito (ou não) aparece aqui.
 */
export function readWithoutContext(draft: string): { checks: PlainCheck[]; gaps: PlainCheck[] } {
  const text = draft.trim();
  const acoes = unique(found(text, ACTION));
  const prazos = unique(found(text, DEADLINE));
  const referencias = unique(found(text, LOOSE_REFERENCE));
  const abertos = unique(found(text, OPEN_AGREEMENT));

  const checks: PlainCheck[] = [
    {
      id: "acao",
      label: "Tem um pedido ou uma ação clara",
      question: "Quem recebeu sabe exatamente o que precisa fazer?",
      detail: acoes.length
        ? `Verbos e pedidos encontrados: ${acoes.join(", ")}.`
        : "Não encontrei pedido nem ação explícita.",
      ok: acoes.length > 0,
    },
    {
      id: "prazo",
      label: "Tem prazo ou momento",
      question: "Está claro até quando isso precisa acontecer?",
      detail: prazos.length ? `Marcas de tempo: ${prazos.join(", ")}.` : "Nenhum prazo ou momento foi escrito.",
      ok: prazos.length > 0,
    },
    {
      id: "referencia",
      label: "Não depende do histórico",
      question: "Alguém que só recebeu este texto sabe a que essas palavras se referem?",
      detail: referencias.length
        ? `Palavras que só fazem sentido com o histórico: ${referencias.join(", ")}.`
        : "Nenhuma referência solta encontrada.",
      ok: referencias.length === 0,
    },
    {
      id: "aberto",
      label: "O que ainda não foi combinado",
      question: "O que continua indefinido está dito no texto?",
      detail: abertos.length ? `Expressões em aberto: ${abertos.join(", ")}.` : "Nenhuma expressão deixada em aberto.",
      ok: abertos.length === 0,
    },
  ];

  return { checks, gaps: checks.filter((check) => !check.ok) };
}
