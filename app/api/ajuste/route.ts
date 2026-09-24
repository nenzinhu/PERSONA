import { buildReadingMessages, buildToneMessages, cleanRewrite, parseReading } from "@/lib/adjust";
import { buildCoachMessages, parseCoach } from "@/lib/coach";
import { runGeneration } from "@/lib/generation";
import { normalizeAjusteRequest, parseAjusteRequest, validationErrorText } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Reescrever uma resposta em outro tom (acao "tom"), ler a mensagem recebida (acao "analise")
// ou comentar as respostas geradas (acao "comentario").
export function POST(req: Request) {
  return runGeneration(req, {
    parse: (raw) => {
      const parsed = parseAjusteRequest(raw);
      return parsed.success
        ? { success: true, data: normalizeAjusteRequest(parsed.data) }
        : { success: false, error: validationErrorText(parsed.error) };
    },
    build: (input) => {
      if (input.acao === "tom") return { ...buildToneMessages(input), maxTokens: 300 };
      if (input.acao === "comentario")
        return { ...buildCoachMessages(input), maxTokens: 200 + 150 * input.respostas.length };
      return { ...buildReadingMessages(input), maxTokens: 400 };
    },
    shape: (raw, input) => {
      if (input.acao === "comentario") {
        const review = parseCoach(raw, input.respostas.length);
        if (!review) throw new Error("Comentário sem versões.");
        return { ...review };
      }
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
