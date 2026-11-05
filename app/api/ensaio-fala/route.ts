import { runGeneration } from "@/lib/generation";
import { buildSpeechReviewMessages, parseSpeechReview } from "@/lib/speech";
import { parseSpeechReviewRequest, validationErrorText } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export function POST(req: Request) {
  return runGeneration(req, {
    parse: (raw) => {
      const parsed = parseSpeechReviewRequest(raw);
      return parsed.success
        ? { success: true, data: parsed.data }
        : { success: false, error: validationErrorText(parsed.error) };
    },
    build: (input) => ({ ...buildSpeechReviewMessages(input), maxTokens: 400 }),
    shape: (raw) => {
      const review = parseSpeechReview(raw);
      if (!review) throw new Error("A revisão não veio no formato esperado.");
      return { ...review };
    },
  });
}
