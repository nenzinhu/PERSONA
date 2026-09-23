import { NextResponse } from "next/server";
import { guard, publicProviderError } from "@/lib/generation";
import { chatWithRetry, ProviderError } from "@/lib/llm";
import { buildPrintMessages, parsePrintOutput, visionTarget } from "@/lib/media";
import { getProvider } from "@/lib/providers";
import { parseLerPrintRequest, validationErrorText } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Bloco C: transforma prints da conversa em linhas "Nome: texto" com um modelo de visão.
export async function POST(req: Request) {
  const guarded = guard(req);
  if (!guarded.ok) return guarded.response;
  const { headers } = guarded;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido ou imagem grande demais." }, { status: 400, headers });
  }
  const parsed = parseLerPrintRequest(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: validationErrorText(parsed.error) }, { status: 400, headers });
  }

  const target = visionTarget(process.env);
  const provider = target && getProvider(target.provider);
  if (!target || !provider) {
    return NextResponse.json(
      {
        error:
          "Ler print precisa de um modelo de visão: cadastre MISTRAL_API_KEY ou GROQ_API_KEY (ou VISION_PROVIDER).",
      },
      { status: 400, headers },
    );
  }

  try {
    const prompt = buildPrintMessages(parsed.data.imagens);
    const output = await chatWithRetry(
      provider,
      process.env,
      { ...prompt, model: target.model, temperature: 0, maxTokens: 1500 },
      50_000,
      1,
    );
    const texto = parsePrintOutput(output);
    if (!texto) {
      return NextResponse.json({ error: "Não achei mensagens nesse print." }, { status: 422, headers });
    }
    return NextResponse.json({ texto, providerLabel: provider.label, model: target.model }, { headers });
  } catch (error) {
    const status = error instanceof ProviderError && error.status === 429 ? 429 : 502;
    return NextResponse.json({ error: publicProviderError(error) }, { status, headers });
  }
}
