import { buildReadingMessages, buildToneMessages, cleanRewrite, parseReading } from "@/lib/adjust";
import { runGeneration } from "@/lib/generation";
import { normalizeAjusteRequest, parseAjusteRequest, validationErrorText } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Bloco A: reescrever uma resposta em outro tom (acao "tom") ou ler a mensagem recebida (acao "analise").
export function POST(req: Request) {
  return runGeneration(req, {
    parse: (raw) => {
      const parsed = parseAjusteRequest(raw);
      return parsed.success
        ? { success: true, data: normalizeAjusteRequest(parsed.data) }
        : { success: false, error: validationErrorText(parsed.error) };
    },
    build: (input) =>
      input.acao === "tom"
        ? { ...buildToneMessages(input), maxTokens: 300 }
        : { ...buildReadingMessages(input), maxTokens: 400 },
    shape: (raw, input) => {
      if (input.acao === "tom") {
        const texto = cleanRewrite(raw);
        if (!texto) throw new Error("Resposta vazia.");
        return { texto };
      }
      const reading = parseReading(raw);
      if (!reading) throw new Error("Análise sem seções.");
      return { ...reading };
    },
  });
}
