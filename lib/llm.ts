import type { ProviderInfo } from "./providers.ts";

type Env = Record<string, string | undefined>;

/** Variáveis `{VAR}` que a URL padrão do provedor precisa (ex: CLOUDFLARE_ACCOUNT_ID). */
export function baseUrlVars(p: ProviderInfo): string[] {
  return [...(p.defaultBaseUrl ?? "").matchAll(/\{([A-Z0-9_]+)\}/g)].map((match) => match[1]);
}

export function baseUrlFor(p: ProviderInfo, env: Env): string | undefined {
  const fromEnv = p.envBaseUrl ? env[p.envBaseUrl]?.trim() : undefined;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (!p.defaultBaseUrl) return undefined;
  if (baseUrlVars(p).some((name) => !env[name]?.trim())) return undefined;
  return p.defaultBaseUrl
    .replace(/\{([A-Z0-9_]+)\}/g, (_, name: string) => encodeURIComponent(env[name]?.trim() ?? ""))
    .replace(/\/+$/, "");
}

export function isConfigured(p: ProviderInfo, env: Env): boolean {
  return Boolean(env[p.envKey]?.trim() && baseUrlFor(p, env));
}

/** Partes de conteúdo no formato OpenAI, para mandar imagens junto com texto. */
export type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

export interface ChatRequest {
  system: string;
  messages: { role: "user" | "assistant"; content: string | ContentPart[] }[];
  model: string;
  temperature: number;
  maxTokens: number;
}

export class ProviderError extends Error {
  // Campo explícito (sem "parameter property") para rodar no node --experimental-strip-types dos testes.
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function parseContent(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => (isRecord(block) && block.type === "text" && typeof block.text === "string" ? block.text : ""))
    .join("")
    .trim();
}

function readErrorDetail(data: unknown, raw: string) {
  if (!isRecord(data)) return raw.slice(0, 200);
  const error = data.error;
  if (isRecord(error) && typeof error.message === "string") return error.message;
  if (typeof data.message === "string") return data.message;
  return raw.slice(0, 200);
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const raw = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new ProviderError(`Provedor respondeu algo inesperado (HTTP ${res.status}).`, 502);
  }
  if (!isRecord(data)) throw new ProviderError(`Provedor respondeu um JSON inesperado (HTTP ${res.status}).`, 502);
  if (!res.ok) {
    const detail = readErrorDetail(data, raw);
    const status = res.status === 429 ? 429 : res.status === 401 || res.status === 403 ? 401 : 502;
    const hint = status === 429 ? " (limite grátis atingido, tente outro provedor ou espere um pouco)" : "";
    throw new ProviderError(`${detail}${hint}`, status);
  }
  return data;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TRANSIENT_STATUS = new Set([408, 429, 500, 502, 503, 504]);

/** Chave e base URL do provedor; lança ProviderError 400 se faltar algo. */
export function credentialsFor(p: ProviderInfo, env: Env): { key: string; base: string } {
  const key = env[p.envKey]?.trim();
  const base = baseUrlFor(p, env);
  if (!key) throw new ProviderError(`Chave ${p.envKey} não configurada no Vercel.`, 400);
  if (!base) throw new ProviderError(`Base URL de ${p.label} não configurada (${p.envBaseUrl}).`, 400);
  return { key, base };
}

/** Converte falhas de rede/timeout em ProviderError, mantendo as que já são. */
export function toProviderError(error: unknown, p: ProviderInfo): ProviderError {
  if (error instanceof ProviderError) return error;
  if (error instanceof DOMException && (error.name === "AbortError" || error.name === "TimeoutError")) {
    return new ProviderError(`${p.label} excedeu o tempo limite.`, 504);
  }
  return new ProviderError(errorMessage(error, `${p.label} falhou durante a requisição.`), 502);
}

export { readJson };

export async function chat(p: ProviderInfo, env: Env, req: ChatRequest, signal?: AbortSignal): Promise<string> {
  const { key, base } = credentialsFor(p, env);

  try {
    if (p.format === "anthropic") {
      const res = await fetch(`${base}/messages`, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          authorization: `Bearer ${key}`,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: req.model,
          system: req.system,
          messages: req.messages,
          max_tokens: req.maxTokens,
          temperature: req.temperature,
        }),
      });
      const data = await readJson(res);
      const text = parseContent(data.content);
      if (!text) throw new ProviderError(`${p.label} devolveu resposta vazia.`, 502);
      return text;
    }

    const headers: Record<string, string> = {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    };
    if (p.id === "openrouter") {
      headers["HTTP-Referer"] = env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000";
      headers["X-Title"] = "Gerador de Respostas";
    }

    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      signal,
      headers,
      body: JSON.stringify({
        model: req.model,
        messages: [{ role: "system", content: req.system }, ...req.messages],
        temperature: req.temperature,
        max_tokens: req.maxTokens,
      }),
    });
    const data = await readJson(res);
    const choices = Array.isArray(data.choices) ? data.choices : [];
    const first = isRecord(choices[0]) ? choices[0] : undefined;
    const message = isRecord(first?.message) ? first.message : undefined;
    const text = parseContent(message?.content);
    if (!text) throw new ProviderError(`${p.label} devolveu resposta vazia ou sem conteúdo de texto.`, 502);
    return text.replace(/[\s\S]*?<\/think>/g, "").trim();
  } catch (error) {
    throw toProviderError(error, p);
  }
}

export async function chatWithRetry(
  p: ProviderInfo,
  env: Env,
  req: ChatRequest,
  timeoutMs = 45_000,
  retries = 1,
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await chat(p, env, req, AbortSignal.timeout(timeoutMs));
    } catch (error) {
      lastError = error;
      const transient = error instanceof ProviderError && TRANSIENT_STATUS.has(error.status);
      if (!transient || attempt >= retries) throw error;
      await delay(500 * 2 ** attempt);
    }
  }
  throw lastError;
}
