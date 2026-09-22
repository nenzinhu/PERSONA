import { runGeneration } from "@/lib/generation";
import { buildConversationMessages, parseAgentOutput } from "@/lib/prompt";
import { normalizeConversaRequest, parseConversaRequest, validationErrorText } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export function POST(req: Request) {
  return runGeneration(req, {
    parse: (raw) => {
      const parsed = parseConversaRequest(raw);
      return parsed.success
        ? { success: true, data: normalizeConversaRequest(parsed.data) }
        : { success: false, error: validationErrorText(parsed.error) };
    },
    // Plano + resposta + 2 pares de réplica cabem com folga em ~900 tokens.
    build: (input) => ({ ...buildConversationMessages(input), maxTokens: 900 }),
    shape: (raw) => {
      const output = parseAgentOutput(raw);
      if (!output.resposta) throw new Error("Resposta vazia.");
      return { ...output };
    },
  });
}
