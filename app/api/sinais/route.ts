import { NextResponse } from "next/server";
import { guard } from "@/lib/generation";
import { parseDecisionRequest } from "@/lib/decisions";
import { buildSpanRequest, parseSpanResponse, SPAN_MODEL } from "@/lib/respan";
import { validationErrorText } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const guarded = guard(req);
  if (!guarded.ok) return guarded.response;
  const { headers } = guarded;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400, headers });
  }
  const parsed = parseDecisionRequest(raw);
  if (!parsed.success) return NextResponse.json({ error: validationErrorText(parsed.error) }, { status: 400, headers });
  if (parsed.data.acao !== "conferir")
    return NextResponse.json({ error: "Esta análise exige um rascunho para conferir." }, { status: 400, headers });
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key)
    return NextResponse.json(
      { error: "Configure a chave OpenRouter para usar estes sinais." },
      { status: 400, headers },
    );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch("https://openrouter.ai/api/alpha/decisions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildSpanRequest(parsed.data)),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      const status = response.status === 429 ? 429 : response.status === 401 || response.status === 403 ? 401 : 502;
      const error =
        status === 429
          ? "Limite da análise atingido. Tente mais tarde."
          : status === 401
            ? "Não foi possível autorizar a análise."
            : "Serviço de sinais indisponível.";
      return NextResponse.json({ error }, { status, headers });
    }
    const scores = parseSpanResponse(await response.json());
    return NextResponse.json({ scores, model: SPAN_MODEL }, { headers });
  } catch {
    return NextResponse.json(
      {
        error: controller.signal.aborted
          ? "A análise excedeu o tempo de espera."
          : "Não foi possível obter sinais válidos.",
      },
      { status: controller.signal.aborted ? 504 : 502, headers },
    );
  } finally {
    clearTimeout(timeout);
  }
}
