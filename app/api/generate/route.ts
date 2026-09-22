import { runGeneration } from "@/lib/generation";
import { buildMessages, splitVariations } from "@/lib/prompt";
import { normalizeGenerateRequest, parseGenerateRequest, validationErrorText } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export function POST(req: Request) {
  return runGeneration(req, {
    parse: (raw) => {
      const parsed = parseGenerateRequest(raw);
      return parsed.success
        ? { success: true, data: normalizeGenerateRequest(parsed.data) }
        : { success: false, error: validationErrorText(parsed.error) };
    },
    build: (input) => ({ ...buildMessages(input), maxTokens: 300 * input.variacoes + 200 }),
    shape: (raw, input) => {
      const variations = splitVariations(raw).slice(0, input.variacoes);
      if (!variations.length) throw new Error("Resposta vazia.");
      return { variations };
    },
  });
}
