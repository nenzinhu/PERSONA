import { cleanRewrite } from "@/lib/adjust";
import { runGeneration } from "@/lib/generation";
import { buildEvaluationMessages, buildSimulatorMessages, parseEvaluation } from "@/lib/simulator";
import { parseSimularRequest, validationErrorText } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Bloco D: a IA responde como a pessoa simulada (acao "responder") ou avalia o treino (acao "avaliar").
export function POST(req: Request) {
  return runGeneration(req, {
    parse: (raw) => {
      const parsed = parseSimularRequest(raw);
      return parsed.success
        ? { success: true, data: parsed.data }
        : { success: false, error: validationErrorText(parsed.error) };
    },
    build: (input) =>
      input.acao === "responder"
        ? { ...buildSimulatorMessages(input), maxTokens: 250 }
        : { ...buildEvaluationMessages(input), maxTokens: 600 },
    shape: (raw, input) => {
      if (input.acao === "responder") {
        // Alguns modelos repetem o nome no começo ("Carlos: ...").
        const prefix = new RegExp(`^${input.pessoa.nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*`, "i");
        const texto = cleanRewrite(raw).replace(prefix, "").trim();
        if (!texto) throw new Error("Resposta vazia.");
        return { texto };
      }
      const evaluation = parseEvaluation(raw);
      if (!evaluation) throw new Error("Avaliação sem seções.");
      return { ...evaluation };
    },
  });
}
