import { credentialsFor, isConfigured, ProviderError, readJson, toProviderError, type ContentPart } from "./llm.ts";
import { getProvider, type ProviderId } from "./providers.ts";

// Bloco C: transcrever áudio (Whisper no Groq) e ler prints de conversa (modelo de visão).

type Env = Record<string, string | undefined>;

export const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGES = 3;
/** ~1 MB de imagem em base64 (o navegador reduz antes de mandar); 3 cabem no limite de 4,5 MB do Vercel. */
export const MAX_IMAGE_CHARS = 1_400_000;

const AUDIO_EXTENSIONS = /\.(ogg|opus|oga|m4a|mp3|mp4|mpeg|mpga|wav|webm|aac|flac)$/i;

export function isAudioFile(file: { name: string; type: string }): boolean {
  return file.type.startsWith("audio/") || AUDIO_EXTENSIONS.test(file.name);
}

export function transcribeModel(env: Env): string {
  return env.TRANSCRIBE_MODEL?.trim() || "whisper-large-v3-turbo";
}

/** Transcreve o áudio no Groq (API compatível com OpenAI) e devolve o texto. */
export async function transcribeAudio(env: Env, file: Blob, filename: string): Promise<string> {
  const groq = getProvider("groq");
  if (!groq) throw new ProviderError("Groq indisponível.", 400);
  const { key, base } = credentialsFor(groq, env);

  const form = new FormData();
  form.append("file", file, filename);
  form.append("model", transcribeModel(env));
  form.append("language", "pt");
  form.append("response_format", "json");
  try {
    const res = await fetch(`${base}/audio/transcriptions`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(45_000),
    });
    const data = await readJson(res);
    const text = typeof data.text === "string" ? data.text.trim() : "";
    if (!text) throw new ProviderError("Não deu para entender o áudio.", 502);
    return text;
  } catch (error) {
    throw toProviderError(error, groq);
  }
}

// Modelos de visão padrão, na ordem de preferência. Os ids mudam: sobrescreva com VISION_PROVIDER/VISION_MODEL.
const VISION_DEFAULTS: { provider: ProviderId; model: string }[] = [
  { provider: "mistral", model: "mistral-small-latest" },
  { provider: "groq", model: "meta-llama/llama-4-scout-17b-16e-instruct" },
];

/** Provedor e modelo de visão a usar, ou `null` se nenhum estiver configurado. */
export function visionTarget(env: Env): { provider: ProviderId; model: string } | null {
  const wanted = env.VISION_PROVIDER?.trim() as ProviderId | undefined;
  const candidates = wanted
    ? [
        {
          provider: wanted,
          model: env.VISION_MODEL?.trim() || VISION_DEFAULTS.find((item) => item.provider === wanted)?.model || "",
        },
      ]
    : VISION_DEFAULTS;
  for (const candidate of candidates) {
    const provider = getProvider(candidate.provider);
    if (provider && candidate.model && isConfigured(provider, env)) return candidate;
  }
  return null;
}

const PRINT_RULES = [
  "Você transcreve prints de conversas do WhatsApp para texto.",
  "Escreva uma linha por mensagem, na ordem, no formato exato: Nome: texto",
  "Mensagens do lado direito (balões verdes, enviados pelo dono do celular) usam o nome Eu.",
  "Mensagens do lado esquerdo usam o nome que aparece no topo da conversa ou acima do balão; se não houver, use Outra pessoa.",
  "Copie o texto como está, com gírias e erros. Ignore horários, datas, ícones, figurinhas e botões. Descreva mídia como [foto], [áudio] ou [figurinha].",
  "Não escreva mais nada além das linhas. Se não houver conversa na imagem, responda só: SEM CONVERSA",
];

export function buildPrintMessages(imagens: string[]): {
  system: string;
  messages: { role: "user"; content: ContentPart[] }[];
} {
  const content: ContentPart[] = [
    { type: "text", text: "Transcreva a conversa destas imagens, em ordem." },
    ...imagens.map((url) => ({ type: "image_url" as const, image_url: { url } })),
  ];
  return { system: PRINT_RULES.join("\n"), messages: [{ role: "user", content }] };
}

/** Limpa a saída do modelo de visão: tira markdown e mantém só linhas "Nome: texto" (e continuações). */
export function parsePrintOutput(raw: string): string {
  const lines: string[] = [];
  for (const rawLine of raw.replace(/\r/g, "").split("\n")) {
    const line = rawLine
      .replace(/^```\w*\s*$/, "")
      .replace(/^\s*[-*•]\s+/, "")
      .replace(/\*\*/g, "")
      .trim();
    if (!line) continue;
    if (/^[^:]{1,40}:\s+\S/.test(line)) lines.push(line);
    else if (lines.length) lines[lines.length - 1] += `\n${line}`;
  }
  return lines.join("\n");
}

export function isImageDataUrl(value: string): boolean {
  return value.length <= MAX_IMAGE_CHARS && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value);
}
