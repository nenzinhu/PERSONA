import { NextResponse } from "next/server";
import { providerEnvStatus } from "@/lib/env";
import { isConfigured } from "@/lib/llm";
import { modelsFor, PROVIDERS } from "@/lib/providers";

export const dynamic = "force-dynamic";

// O frontend recebe apenas disponibilidade; chaves e URLs nunca são devolvidas.
export function GET() {
  const env = process.env;
  const environment = providerEnvStatus(env);
  return NextResponse.json(
    {
      needsPassword: Boolean(env.APP_PASSWORD),
      providers: PROVIDERS.map((provider) => ({
        id: provider.id,
        label: provider.label,
        site: provider.site,
        freeTier: provider.freeTier,
        configured: isConfigured(provider, env),
        models: modelsFor(provider, env),
      })),
      environment: {
        missing: environment
          .filter((status) => !status.configured)
          .map((status) => ({
            provider: status.id,
            variables: status.missing,
          })),
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
