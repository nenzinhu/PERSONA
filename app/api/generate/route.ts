import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { chatWithRetry, isConfigured, ProviderError } from "@/lib/llm";
import { getProvider, modelsFor, PROVIDERS, recommend } from "@/lib/providers";
import { buildMessages, splitVariations } from "@/lib/prompt";
import { checkRateLimitKey, rateLimitConfigFromEnv, rateLimitKeyFromRequest } from "@/lib/rateLimit";
import { normalizeGenerateRequest, parseGenerateRequest, validationErrorText } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function passwordMatches(provided: string | null, expected: string | undefined) {
  if (!expected) return true;
  const actual = Buffer.from(provided ?? "");
  const wanted = Buffer.from(expected);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

function rateHeaders(result: ReturnType<typeof checkRateLimitKey>) {
  return new Headers({
    "cache-control": "no-store",
    "x-ratelimit-limit": String(result.limit),
    "x-ratelimit-remaining": String(result.remaining),
    "x-ratelimit-reset": String(result.resetInSeconds),
  });
}

function publicProviderError(error: unknown) {
  if (!(error instanceof ProviderError)) return "Falha interna ao chamar o provedor.";
  if (error.status === 400) return "Configuração inválida do provedor.";
  if (error.status === 401 || error.status === 403) return "Chave do provedor inválida ou sem permissão.";
  if (error.status === 429) return "Limite do provedor atingido.";
  if (error.status === 504) return "Tempo limite do provedor excedido.";
  return "Provedor indisponível.";
}

export async function POST(req: Request) {
  const env = process.env;
  if (!passwordMatches(req.headers.get("x-app-password"), env.APP_PASSWORD)) {
    return NextResponse.json(
      { error: "Senha do app incorreta." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const rate = checkRateLimitKey(rateLimitKeyFromRequest(req), rateLimitConfigFromEnv(env));
  const headers = rateHeaders(rate);
  if (!rate.allowed) {
    headers.set("retry-after", String(rate.resetInSeconds));
    return NextResponse.json(
      { error: "Limite de tentativas atingido. Tente novamente em alguns instantes." },
      {
        status: 429,
        headers,
      },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400, headers });
  }

  const parsed = parseGenerateRequest(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: validationErrorText(parsed.error) }, { status: 400, headers });
  }

  const input = normalizeGenerateRequest(parsed.data);
  const available = PROVIDERS.filter((provider) => isConfigured(provider, env)).map((provider) => ({
    id: provider.id,
    models: modelsFor(provider, env),
  }));
  let attempts: { provider: string; model: string }[];

  if (input.provider === "auto") {
    attempts = recommend(input.kind, available).slice(0, 3);
    if (!attempts.length) {
      return NextResponse.json(
        {
          error: "Nenhuma chave de API configurada. Cadastre ao menos GROQ_API_KEY no Vercel.",
        },
        { status: 400, headers },
      );
    }
  } else {
    const provider = getProvider(input.provider);
    if (!provider) return NextResponse.json({ error: "Provedor desconhecido." }, { status: 400, headers });
    const providerModels = modelsFor(provider, env);
    const model = input.model || providerModels[0]?.id;
    if (!model)
      return NextResponse.json({ error: `Informe o id do modelo para ${provider.label}.` }, { status: 400, headers });
    if (provider.id !== "custom" && !providerModels.some((candidate) => candidate.id === model)) {
      return NextResponse.json(
        { error: `Modelo ${model} não está disponível para ${provider.label}.` },
        { status: 400, headers },
      );
    }
    attempts = [{ provider: provider.id, model }];
  }

  const prompt = buildMessages(input);
  const errors: string[] = [];
  let lastProviderStatus = 502;

  for (const attempt of attempts) {
    const provider = getProvider(attempt.provider);
    if (!provider) continue;
    try {
      const raw = await chatWithRetry(
        provider,
        env,
        {
          system: prompt.system,
          messages: prompt.messages,
          model: attempt.model,
          temperature: input.temperature,
          maxTokens: 300 * input.variacoes + 200,
        },
        45_000,
        1,
      );
      const variations = splitVariations(raw).slice(0, input.variacoes);
      if (!variations.length) throw new Error(`${provider.label} devolveu resposta vazia.`);
      return NextResponse.json(
        {
          variations,
          provider: provider.id,
          providerLabel: provider.label,
          model: attempt.model,
          fallbacks: errors,
        },
        { headers },
      );
    } catch (error) {
      errors.push(publicProviderError(error));
      if (error instanceof ProviderError) {
        lastProviderStatus = error.status;
        if (error.status === 400 || error.status === 401 || error.status === 403) break;
      }
    }
  }

  const status =
    lastProviderStatus === 429 ? 429 : lastProviderStatus === 401 || lastProviderStatus === 403 ? 401 : 502;
  return NextResponse.json(
    { error: "Não foi possível gerar a resposta com os provedores disponíveis." },
    { status, headers },
  );
}
