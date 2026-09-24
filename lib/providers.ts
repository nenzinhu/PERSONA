// Catálogo de provedores e modelos (todos com opção gratuita ou créditos grátis).
// As listas de modelos grátis mudam com frequência: qualquer provedor aceita
// sobrescrever a lista via env `<PROVIDER>_MODELS=id1,id2` e a UI aceita um id livre.
//
// As notas são estimativas de naturalidade em PT-BR informal. Modelos de código,
// de domínio (saúde/finanças) ou muito pequenos recebem nota baixa de propósito.

export type ProviderId =
  | "groq"
  | "nous"
  | "nvidia"
  | "mistral"
  | "anyapi"
  | "orcarouter"
  | "openrouter"
  | "together"
  | "cloudflare"
  | "cohere"
  | "huggingface"
  | "modelscope"
  | "aihubmix"
  | "custom";
export type ApiFormat = "openai" | "anthropic";

/** Tipos de texto usados para recomendar o modelo. */
export type TextKind = "casual" | "argumento" | "persona" | "formal";

export const TEXT_KINDS: { id: TextKind; label: string; hint: string }[] = [
  { id: "casual", label: "Curta / casual", hint: "zap do dia a dia, 1–3 frases" },
  { id: "argumento", label: "Elaborada / rebater", hint: "opinião, discordar, explicar" },
  { id: "persona", label: "Meu jeito (persona)", hint: "copiar gírias e manias suas" },
  { id: "formal", label: "Formal / trabalho", hint: "cliente, chefe, e-mail curto" },
];

export interface ModelInfo {
  id: string;
  label: string;
  /** Nota 1–5 por tipo de texto (qualidade do PT-BR informal, naturalidade, raciocínio). */
  scores: Record<TextKind, number>;
  speed: 1 | 2 | 3; // 3 = muito rápido
  note: string;
}

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  format: ApiFormat;
  envKey: string;
  envBaseUrl?: string;
  /** Pode conter `{VAR}`, trocado pelo valor da env (ex: o id da conta na Cloudflare). */
  defaultBaseUrl?: string;
  site: string;
  freeTier: string;
  models: ModelInfo[];
  /** Notas para modelos definidos só via env (`<PROVIDER>_MODELS`). */
  envModelScores?: Record<TextKind, number>;
}

const s = (casual: number, argumento: number, persona: number, formal: number) => ({
  casual,
  argumento,
  persona,
  formal,
});

const CODE = "Focado em código: não recomendado para conversa.";

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "groq",
    label: "Groq",
    format: "openai",
    envKey: "GROQ_API_KEY",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    site: "https://console.groq.com/keys",
    freeTier: "Grátis com limite por minuto/dia. O mais rápido de todos.",
    models: [
      {
        id: "qwen/qwen3.6-27b",
        label: "Qwen 3.6 27B",
        scores: s(5, 4, 4, 4),
        speed: 3,
        note: "Rápido e com PT-BR natural. Melhor escolha para zap curto.",
      },
      {
        id: "openai/gpt-oss-120b",
        label: "GPT-OSS 120B",
        scores: s(3, 4, 3, 5),
        speed: 3,
        note: "Raciocina bem; ótimo para formal. Tende a soar ‘certinho’.",
      },
      {
        id: "groq/compound",
        label: "Groq Compound",
        scores: s(3, 4, 3, 4),
        speed: 2,
        note: "Sistema com busca na web; útil quando a resposta precisa de fato atual.",
      },
      {
        id: "groq/compound-mini",
        label: "Groq Compound Mini",
        scores: s(3, 3, 2, 3),
        speed: 3,
        note: "Versão leve do Compound.",
      },
      {
        id: "openai/gpt-oss-20b",
        label: "GPT-OSS 20B",
        scores: s(3, 3, 2, 4),
        speed: 3,
        note: "Leve e rápido, mas genérico.",
      },
      {
        id: "allam-2-7b",
        label: "ALLaM 2 7B",
        scores: s(1, 1, 1, 1),
        speed: 3,
        note: "Focado em árabe: evite para PT-BR.",
      },
    ],
  },
  {
    id: "nous",
    label: "Nous Portal",
    format: "openai",
    envKey: "NOUS_API_KEY",
    envBaseUrl: "NOUS_BASE_URL",
    defaultBaseUrl: "https://inference-api.nousresearch.com/v1",
    site: "https://portal.nousresearch.com",
    freeTier: "Modelos :free e créditos grátis ao criar conta.",
    models: [
      {
        id: "deepseek/deepseek-v4-flash-0731",
        label: "DeepSeek V4 Flash",
        scores: s(4, 5, 5, 5),
        speed: 2,
        note: "O mais completo da lista: argumenta bem e imita estilo.",
      },
      {
        id: "meituan/longcat-2.0:free",
        label: "LongCat 2.0 (free)",
        scores: s(4, 4, 4, 4),
        speed: 2,
        note: "Modelo grande e grátis; bom geral.",
      },
      {
        id: "qwen/qwen3.7-flash",
        label: "Qwen 3.7 Flash",
        scores: s(4, 4, 4, 4),
        speed: 3,
        note: "Rápido e multilíngue.",
      },
      {
        id: "mistralai/mistral-nemo",
        label: "Mistral Nemo",
        scores: s(4, 3, 4, 3),
        speed: 3,
        note: "Solto e pouco ‘certinho’; bom para persona.",
      },
      { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", scores: s(3, 4, 3, 5), speed: 2, note: "Bom para formal." },
      { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B", scores: s(3, 3, 2, 4), speed: 2, note: "Leve e genérico." },
      {
        id: "meta-llama/llama-3.1-8b-instruct",
        label: "Llama 3.1 8B",
        scores: s(3, 2, 2, 3),
        speed: 3,
        note: "Básico e rápido.",
      },
      {
        id: "amazon/nova-micro-v1",
        label: "Nova Micro",
        scores: s(2, 2, 2, 3),
        speed: 3,
        note: "Pequeno; só para respostas simples.",
      },
      {
        id: "inclusionai/ling-3.0-flash-sante:free",
        label: "Ling 3.0 Flash Saúde (free)",
        scores: s(2, 2, 1, 3),
        speed: 2,
        note: "Especializado em saúde.",
      },
      {
        id: "inclusionai/ling-3.0-flash-fin:free",
        label: "Ling 3.0 Flash Finanças (free)",
        scores: s(2, 2, 1, 3),
        speed: 2,
        note: "Especializado em finanças.",
      },
      { id: "poolside/laguna-s-2.1:free", label: "Laguna S 2.1 (free)", scores: s(1, 2, 1, 2), speed: 2, note: CODE },
      { id: "poolside/laguna-xs-2.1:free", label: "Laguna XS 2.1 (free)", scores: s(1, 1, 1, 2), speed: 2, note: CODE },
    ],
  },
  {
    id: "nvidia",
    label: "NVIDIA NIM",
    format: "openai",
    envKey: "NVIDIA_API_KEY",
    defaultBaseUrl: "https://integrate.api.nvidia.com/v1",
    site: "https://build.nvidia.com",
    freeTier: "Créditos grátis para desenvolvedor.",
    models: [
      {
        id: "nvidia/nemotron-3-super-120b-a12b",
        label: "Nemotron 3 Super 120B",
        scores: s(3, 5, 3, 5),
        speed: 2,
        note: "Preciso e forte em argumentação; mais formal.",
      },
    ],
  },
  {
    id: "mistral",
    label: "Mistral",
    format: "openai",
    envKey: "MISTRAL_API_KEY",
    defaultBaseUrl: "https://api.mistral.ai/v1",
    site: "https://console.mistral.ai/api-keys",
    freeTier: "Plano Experiment grátis com limite por minuto.",
    models: [
      {
        id: "ministral-14b-latest",
        label: "Ministral 14B",
        scores: s(4, 3, 4, 4),
        speed: 3,
        note: "Bom PT-BR e tom natural; boa opção para casual e persona.",
      },
      { id: "ministral-8b-latest", label: "Ministral 8B", scores: s(3, 2, 3, 3), speed: 3, note: "Rápido e simples." },
      { id: "ministral-3b-latest", label: "Ministral 3B", scores: s(2, 1, 2, 2), speed: 3, note: "Muito pequeno." },
      { id: "codestral-latest", label: "Codestral", scores: s(1, 1, 1, 2), speed: 3, note: CODE },
    ],
  },
  {
    id: "anyapi",
    label: "AnyAPI",
    format: "openai",
    envKey: "ANYAPI_API_KEY",
    envBaseUrl: "ANYAPI_BASE_URL",
    defaultBaseUrl: "https://api.anyapi.ai/v1",
    site: "https://anyapi.ai",
    freeTier: "Endpoint compatível com OpenAI, com modelos :free.",
    models: [
      {
        id: "dots-studio/dots-3-note-preview:free",
        label: "Dots 3 Note (free)",
        scores: s(3, 3, 3, 3),
        speed: 2,
        note: "Preview; qualidade variável.",
      },
      {
        id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        label: "Nemotron 3 Nano Omni (free)",
        scores: s(2, 3, 2, 3),
        speed: 2,
        note: "Modelo de raciocínio; lento para zap.",
      },
    ],
  },
  {
    id: "orcarouter",
    label: "OrcaRouter",
    format: "openai",
    envKey: "ORCAROUTER_API_KEY",
    envBaseUrl: "ORCAROUTER_BASE_URL",
    defaultBaseUrl: "https://api.orcarouter.ai/v1",
    site: "https://orcarouter.ai",
    freeTier: "Roteador compatível com OpenAI com modelos -free.",
    models: [
      {
        id: "deepseek/deepseek-v4-flash-free",
        label: "DeepSeek V4 Flash (free)",
        scores: s(4, 5, 5, 5),
        speed: 2,
        note: "Mesmo DeepSeek V4 Flash, grátis.",
      },
      {
        id: "z-ai/glm-5.3-flash-free",
        label: "GLM 5.3 Flash (free)",
        scores: s(4, 5, 4, 4),
        speed: 2,
        note: "Escrita fluida; bom para opinião.",
      },
      {
        id: "tencent/hy3-free",
        label: "Hunyuan 3 (free)",
        scores: s(3, 4, 3, 4),
        speed: 2,
        note: "Capaz, PT-BR às vezes rígido.",
      },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter (free)",
    format: "openai",
    envKey: "OPENROUTER_API_KEY",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    site: "https://openrouter.ai/models?max_price=0",
    freeTier: "Modelos :free. Limite diário baixo sem créditos.",
    models: [
      {
        id: "nvidia/nemotron-3-super-120b-a12b:free",
        label: "Nemotron 3 Super 120B (free)",
        scores: s(3, 5, 3, 5),
        speed: 1,
        note: "Forte e grátis, porém mais lento.",
      },
      {
        id: "openrouter/free",
        label: "Auto grátis",
        scores: s(3, 3, 3, 3),
        speed: 2,
        note: "O OpenRouter escolhe um modelo grátis disponível. Bom como reserva.",
      },
      {
        id: "nex-agi/nex-n2.5-pro:free",
        label: "Nex N2.5 Pro (free)",
        scores: s(3, 3, 3, 3),
        speed: 2,
        note: "Geral.",
      },
      {
        id: "dots-studio/dots-3-note-preview:free",
        label: "Dots 3 Note (free)",
        scores: s(3, 3, 3, 3),
        speed: 2,
        note: "Preview; qualidade variável.",
      },
      {
        id: "nex-agi/nex-n2.5-mini:free",
        label: "Nex N2.5 Mini (free)",
        scores: s(2, 2, 2, 3),
        speed: 3,
        note: "Leve.",
      },
      {
        id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        label: "Nemotron 3 Nano Omni (free)",
        scores: s(2, 3, 2, 3),
        speed: 2,
        note: "Raciocínio; lento para zap.",
      },
      {
        id: "inclusionai/ling-3.0-flash-fin:free",
        label: "Ling 3.0 Flash Finanças (free)",
        scores: s(2, 2, 1, 3),
        speed: 2,
        note: "Especializado em finanças.",
      },
      {
        id: "liquid/lfm-2.5-2.6b:free",
        label: "LFM 2.5 2.6B (free)",
        scores: s(2, 1, 1, 2),
        speed: 3,
        note: "Muito pequeno.",
      },
      {
        id: "cohere/north-mini-code:free",
        label: "North Mini Code (free)",
        scores: s(1, 1, 1, 2),
        speed: 3,
        note: CODE,
      },
      { id: "poolside/laguna-xs-2.1:free", label: "Laguna XS 2.1 (free)", scores: s(1, 1, 1, 2), speed: 2, note: CODE },
    ],
  },
  {
    id: "together",
    label: "Together AI",
    format: "openai",
    envKey: "TOGETHER_API_KEY",
    defaultBaseUrl: "https://api.together.xyz/v1",
    site: "https://api.together.xyz/models",
    freeTier: "Modelos com sufixo -Free, sem custo e com limite por minuto.",
    models: [
      {
        id: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        label: "Llama 3.3 70B Turbo (free)",
        scores: s(4, 4, 4, 4),
        speed: 2,
        note: "Bom PT-BR e natural; ótimo reserva grátis.",
      },
      {
        id: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
        label: "DeepSeek R1 Distill 70B (free)",
        scores: s(2, 4, 2, 3),
        speed: 1,
        note: "Raciocina antes de responder: lento para zap.",
      },
    ],
  },
  {
    id: "cloudflare",
    label: "Cloudflare Workers AI",
    format: "openai",
    envKey: "CLOUDFLARE_API_TOKEN",
    defaultBaseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    site: "https://dash.cloudflare.com/?to=/:account/ai/workers-ai",
    freeTier: "10 mil neurons grátis por dia. Precisa também de CLOUDFLARE_ACCOUNT_ID.",
    models: [
      {
        id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        label: "Llama 3.3 70B Fast",
        scores: s(4, 4, 4, 4),
        speed: 3,
        note: "Rápido e com PT-BR natural.",
      },
      {
        id: "@cf/mistralai/mistral-small-3.1-24b-instruct",
        label: "Mistral Small 3.1 24B",
        scores: s(4, 3, 4, 4),
        speed: 3,
        note: "Tom solto; bom para casual.",
      },
      {
        id: "@cf/meta/llama-4-scout-17b-16e-instruct",
        label: "Llama 4 Scout 17B",
        scores: s(3, 3, 3, 4),
        speed: 3,
        note: "Leve e multilíngue.",
      },
      {
        id: "@cf/google/gemma-3-12b-it",
        label: "Gemma 3 12B",
        scores: s(3, 3, 3, 3),
        speed: 3,
        note: "Pequeno, mas escreve bem em português.",
      },
    ],
  },
  {
    id: "cohere",
    label: "Cohere",
    format: "openai",
    envKey: "COHERE_API_KEY",
    defaultBaseUrl: "https://api.cohere.ai/compatibility/v1",
    site: "https://dashboard.cohere.com/api-keys",
    freeTier: "Chave de teste grátis (limite mensal de chamadas).",
    models: [
      {
        id: "command-a-03-2025",
        label: "Command A",
        scores: s(4, 5, 4, 5),
        speed: 2,
        note: "Forte em argumentação e formal; PT-BR bom.",
      },
      {
        id: "command-r7b-12-2024",
        label: "Command R7B",
        scores: s(3, 2, 3, 3),
        speed: 3,
        note: "Pequeno e rápido.",
      },
    ],
  },
  {
    id: "huggingface",
    label: "Hugging Face",
    format: "openai",
    envKey: "HUGGINGFACE_API_KEY",
    defaultBaseUrl: "https://router.huggingface.co/v1",
    site: "https://huggingface.co/settings/tokens",
    freeTier: "Créditos mensais grátis no Inference Providers.",
    models: [
      {
        id: "Qwen/Qwen3-235B-A22B-Instruct-2507",
        label: "Qwen 3 235B",
        scores: s(4, 5, 4, 5),
        speed: 2,
        note: "Muito capaz e multilíngue.",
      },
      {
        id: "deepseek-ai/DeepSeek-V3-0324",
        label: "DeepSeek V3",
        scores: s(4, 5, 5, 4),
        speed: 2,
        note: "Imita bem o estilo; bom para persona.",
      },
      {
        id: "meta-llama/Llama-3.3-70B-Instruct",
        label: "Llama 3.3 70B",
        scores: s(4, 4, 4, 4),
        speed: 2,
        note: "Equilibrado e natural.",
      },
      {
        id: "google/gemma-3-27b-it",
        label: "Gemma 3 27B",
        scores: s(3, 3, 3, 4),
        speed: 2,
        note: "Bom português, um pouco formal.",
      },
    ],
  },
  {
    id: "modelscope",
    label: "ModelScope",
    format: "openai",
    envKey: "MODELSCOPE_API_KEY",
    defaultBaseUrl: "https://api-inference.modelscope.cn/v1",
    site: "https://modelscope.cn/my/myaccesstoken",
    freeTier: "Chamadas grátis por dia (conta vinculada à Alibaba Cloud).",
    models: [
      {
        id: "Qwen/Qwen3-235B-A22B-Instruct-2507",
        label: "Qwen 3 235B",
        scores: s(4, 5, 4, 5),
        speed: 2,
        note: "Muito capaz e multilíngue.",
      },
      {
        id: "deepseek-ai/DeepSeek-V3.1",
        label: "DeepSeek V3.1",
        scores: s(4, 5, 5, 4),
        speed: 2,
        note: "Imita bem o estilo.",
      },
      {
        id: "moonshotai/Kimi-K2-Instruct",
        label: "Kimi K2",
        scores: s(4, 4, 4, 4),
        speed: 2,
        note: "Escrita fluida.",
      },
      {
        id: "Qwen/Qwen3-32B",
        label: "Qwen 3 32B",
        scores: s(3, 4, 3, 4),
        speed: 2,
        note: "Menor e mais rápido.",
      },
    ],
  },
  {
    id: "aihubmix",
    label: "AIHubMix",
    format: "openai",
    envKey: "AIHUBMIX_API_KEY",
    defaultBaseUrl: "https://aihubmix.com/v1",
    site: "https://aihubmix.com/models",
    freeTier: "Roteador com modelos -free. Os ids mudam: confira em aihubmix.com/models e use AIHUBMIX_MODELS.",
    models: [
      {
        id: "gemini-2.0-flash-free",
        label: "Gemini 2.0 Flash (free)",
        scores: s(4, 4, 4, 4),
        speed: 3,
        note: "Rápido e bom em PT-BR.",
      },
      {
        id: "gpt-4.1-free",
        label: "GPT-4.1 (free)",
        scores: s(4, 4, 4, 5),
        speed: 2,
        note: "Equilibrado; um pouco certinho.",
      },
    ],
  },
  {
    id: "custom",
    label: "Meu modelo (fine-tune)",
    format: "openai",
    envKey: "CUSTOM_API_KEY",
    envBaseUrl: "CUSTOM_BASE_URL",
    site: "",
    freeTier:
      "O modelo que você treinou (Ollama via túnel, HF Endpoint, Together...). Defina CUSTOM_BASE_URL e CUSTOM_MODELS.",
    models: [],
    // Treinado com as suas mensagens: é o melhor para imitar você.
    envModelScores: s(5, 3, 6, 3),
  },
];

export function getProvider(id: string): ProviderInfo | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

/** Modelos do provedor, respeitando override via env `<PROVIDER>_MODELS` (só no servidor). */
export function modelsFor(p: ProviderInfo, env: Record<string, string | undefined> = {}): ModelInfo[] {
  const override = env[`${p.id.toUpperCase()}_MODELS`];
  if (!override) return p.models;
  return override
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map(
      (id) =>
        p.models.find((m) => m.id === id) ?? {
          id,
          label: id,
          scores: p.envModelScores ?? s(3, 3, 3, 3),
          speed: 2 as const,
          note: p.id === "custom" ? "Seu modelo treinado com as suas mensagens." : "Definido via env.",
        },
    );
}

export interface Recommendation {
  provider: ProviderId;
  model: string;
  label: string;
  score: number;
  why: string;
}

/** Ordena modelos disponíveis (com chave) pelo tipo de texto; empate → mais rápido. */
/** Modelos de um provedor do melhor para o pior no tipo de texto (nota, depois velocidade). */
export function rankModels(kind: TextKind, models: ModelInfo[]): ModelInfo[] {
  return [...models].sort((a, b) => b.scores[kind] * 10 + b.speed - (a.scores[kind] * 10 + a.speed));
}

export function recommend(kind: TextKind, available: { id: ProviderId; models: ModelInfo[] }[]): Recommendation[] {
  const out: Recommendation[] = [];
  for (const p of available) {
    const info = getProvider(p.id);
    for (const m of p.models) {
      out.push({
        provider: p.id,
        model: m.id,
        label: `${info?.label ?? p.id} · ${m.label}`,
        score: m.scores[kind] * 10 + m.speed,
        why: m.note,
      });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}
