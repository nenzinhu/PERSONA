// Backup local do Persona: exportar e restaurar o que fica neste navegador.
export const BACKUP_VERSION = 1;
export const BACKUP_APP = "persona";

/** Chaves do localStorage que entram no backup (dados locais do app). */
export const BACKUP_KEYS = [
  "settings",
  "perfil",
  "theme",
  "tab",
  "history",
  "preferencias",
  "decision-pending",
  "communication-journal",
  "communication-agreements",
  "conversa-eu",
  "response-library",
  "style-corrections",
  "service-order-history",
  "training-journal",
] as const;

export type BackupKey = (typeof BACKUP_KEYS)[number];

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  data: Partial<Record<BackupKey, unknown>>;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isWrapped = (value: unknown): value is { version: number; value: unknown } =>
  isObject(value) && value.version === BACKUP_VERSION && "value" in value;

/** Monta o arquivo de backup a partir dos valores crus do localStorage. */
export function buildBackup(entries: Record<string, string | null>, exportedAt: string): BackupFile {
  const data: Partial<Record<BackupKey, unknown>> = {};
  for (const key of BACKUP_KEYS) {
    const raw = entries[key];
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isWrapped(parsed)) data[key] = parsed;
    } catch {
      // valor corrompido no storage não entra no backup
    }
  }
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt, data };
}

export type ParsedBackup = { ok: true; backup: BackupFile } | { ok: false; error: string };

export function parseBackup(raw: string): ParsedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Este arquivo não é um JSON válido." };
  }
  if (!isObject(parsed) || parsed.app !== BACKUP_APP)
    return { ok: false, error: "Este arquivo não é um backup do Persona." };
  if (parsed.version !== BACKUP_VERSION)
    return { ok: false, error: `Versão de backup não suportada: ${String(parsed.version)}.` };
  if (!isObject(parsed.data)) return { ok: false, error: "O backup não tem dados válidos." };

  const data: Partial<Record<BackupKey, unknown>> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (!(BACKUP_KEYS as readonly string[]).includes(key)) continue; // chaves desconhecidas são ignoradas
    if (isWrapped(value)) data[key as BackupKey] = value;
  }
  if (!Object.keys(data).length) return { ok: false, error: "O backup não tem nenhum dado do Persona." };
  return {
    ok: true,
    backup: { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: String(parsed.exportedAt ?? ""), data },
  };
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function matcher(terms: string[]) {
  return new RegExp(
    `(?<![\\p{L}\\p{N}_])(?:${[...terms]
      .sort((a, b) => b.length - a.length)
      .map(escape)
      .join("|")})(?![\\p{L}\\p{N}_])`,
    "giu",
  );
}

/** Substitui termos reais por apelidos em qualquer string, mantendo o formato JSON. */
export function replaceInText(text: string, aliases: { original: string; alias: string }[]): string {
  const valid = aliases.filter((entry) => entry.original.trim() && entry.alias.trim());
  if (!valid.length) return text;
  const map = new Map(valid.map((entry) => [entry.original.trim().toLowerCase(), entry.alias.trim()]));
  return text.replace(
    matcher(valid.map((entry) => entry.original.trim())),
    (word) => map.get(word.toLowerCase()) ?? word,
  );
}

/** Versão anonimizada: cada valor do backup passa pela troca de termos. */
export function anonymizeBackup(backup: BackupFile, aliases: { original: string; alias: string }[]): BackupFile {
  if (!aliases.length) return backup;
  const data: Partial<Record<BackupKey, unknown>> = {};
  for (const [key, value] of Object.entries(backup.data)) {
    data[key as BackupKey] = JSON.parse(replaceInText(JSON.stringify(value), aliases));
  }
  return { ...backup, data };
}
