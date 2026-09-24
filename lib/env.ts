import { baseUrlVars } from "./llm.ts";
import { PROVIDERS, type ProviderId } from "./providers.ts";

export interface ProviderEnvStatus {
  id: ProviderId;
  configured: boolean;
  missing: string[];
}

function has(value: string | undefined) {
  return Boolean(value?.trim());
}

function baseUrlNeeds(provider: (typeof PROVIDERS)[number]): string[] {
  if (!provider.defaultBaseUrl) return provider.envBaseUrl ? [provider.envBaseUrl] : [];
  return baseUrlVars(provider);
}

export function providerEnvStatus(env: Record<string, string | undefined> = process.env): ProviderEnvStatus[] {
  return PROVIDERS.map((provider) => {
    // A base URL só falta quando não há padrão, ou quando o padrão depende de outra env ausente.
    const baseUrl = provider.envBaseUrl && has(env[provider.envBaseUrl]) ? [] : baseUrlNeeds(provider);
    const missing = [provider.envKey, ...baseUrl].filter((name) => !has(env[name]));
    return {
      id: provider.id,
      configured: missing.length === 0,
      missing,
    };
  });
}

export function validateProviderEnv(env: Record<string, string | undefined> = process.env) {
  const statuses = providerEnvStatus(env);
  return {
    valid: statuses.some((status) => status.configured),
    configuredCount: statuses.filter((status) => status.configured).length,
    statuses,
    missingKeys: statuses.flatMap((status) => status.missing),
  };
}
