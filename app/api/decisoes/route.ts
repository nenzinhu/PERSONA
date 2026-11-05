import { runGeneration } from "@/lib/generation";
import { parseDecisionRequest, buildDecisionMessages, parseDecisionOutput } from "@/lib/decisions";
import { validationErrorText } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export function POST(req: Request) {
  return runGeneration(req, {
    parse: (raw) => {
      const result = parseDecisionRequest(raw);
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: validationErrorText(result.error) };
    },
    build: buildDecisionMessages,
    shape: (raw, input) => ({ ...parseDecisionOutput(raw, input) }),
  });
}
