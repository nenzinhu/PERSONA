import { PROVIDERS, type ProviderId } from "./providers.ts";

export interface ProviderEnvStatus {
  id: ProviderId;
  configured: boolean;
  missing: string[];
}

function has(value: string | undefined) {
  return Boolean(value?.trim());
}

export function providerEnvStatus(env: Record<string, string | undefined> = process.env): ProviderEnvStatus[] {
  return PROVIDERS.map((provider) => {
    const missing = [provider.envKey, provider.envBaseUrl]
      .filter((name): name is string => Boolean(name))
      .filter((name) => !has(env[name]));
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
