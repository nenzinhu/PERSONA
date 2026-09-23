import type { Reading, Tone } from "./adjust.ts";
import { profileForRequest, type StyleProfile } from "./prompt.ts";
import type { Settings } from "./types.ts";

/** POST JSON para as rotas do app, com a senha no header. Lança Error com a mensagem do servidor. */
export async function postJson<T>(url: string, body: unknown, senha: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-app-password": senha },
    signal,
    body: JSON.stringify(body),
  });
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // corpo vazio ou não-JSON: cai na mensagem genérica
  }
  const error = data && typeof data === "object" && "error" in data ? String(data.error) : "";
  if (!response.ok) throw new Error(error || "Erro ao gerar");
  return data as T;
}

/** Campos de provedor/modelo que toda rota de IA recebe, a partir das configurações salvas. */
export function modelFields(settings: Settings) {
  return {
    kind: settings.kind,
    provider: settings.provider,
    model: settings.model,
    temperature: settings.temperatura,
  };
}

/** Reescreve `texto` no tom pedido, usando o seu estilo. */
export async function requestTone(
  args: { tom: Tone; texto: string; contexto: string; settings: Settings; perfil: StyleProfile; senha: string },
  signal?: AbortSignal,
): Promise<string> {
  const data = await postJson<{ texto: string }>(
    "/api/ajuste",
    {
      acao: "tom",
      tom: args.tom,
      texto: args.texto,
      contexto: args.contexto.slice(0, 1000),
      tracos: args.settings.tracos,
      emoji: args.settings.emoji,
      perfil: profileForRequest(args.perfil),
      ...modelFields(args.settings),
    },
    args.senha,
    signal,
  );
  return data.texto;
}

/** Lê a emoção, a intenção e as entrelinhas de uma mensagem recebida. */
export function requestReading(
  args: { texto: string; contexto: string; settings: Settings; senha: string },
  signal?: AbortSignal,
): Promise<Reading> {
  return postJson<Reading>(
    "/api/ajuste",
    {
      acao: "analise",
      texto: args.texto.slice(-4000),
      contexto: args.contexto.slice(-4000),
      ...modelFields(args.settings),
    },
    args.senha,
    signal,
  );
}

/** Mensagem amigável para erros de fetch, incluindo cancelamento. */
export function errorText(caught: unknown) {
  if (caught instanceof DOMException && caught.name === "AbortError") return "Cancelado.";
  return caught instanceof Error ? caught.message : String(caught);
}
