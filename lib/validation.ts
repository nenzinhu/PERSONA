import { z } from "zod";
import { sanitizeTraits } from "./traits.ts";
import { MAX_EXAMPLES } from "./prompt.ts";
import { MAX_TRAITS } from "./traits.ts";
import { MAX_CONVERSATION } from "./whatsapp.ts";
import { TONES } from "./adjust.ts";
import type { Mode, Stance } from "./prompt.ts";
import type { ProviderId, TextKind } from "./providers.ts";

const optionalText = (max: number) =>
  z.preprocess((value) => (value === null || value === "" ? undefined : value), z.string().trim().max(max).optional());

const profileSchema = z
  .object({
    nome: optionalText(60).default(""),
    descricao: optionalText(1000).default(""),
    exemplos: z
      .array(
        z.object({
          contexto: z.string().trim().max(1000),
          resposta: z.string().trim().max(1000),
        }),
      )
      .max(MAX_EXAMPLES)
      .default([]),
  })
  .default({ nome: "", descricao: "", exemplos: [] });

const providerEnum = z.enum([
  "auto",
  "groq",
  "nous",
  "nvidia",
  "mistral",
  "anyapi",
  "orcarouter",
  "openrouter",
  "custom",
]);

export const generateRequestSchema = z
  .object({
    mode: z.enum(["pergunta", "afirmacao"]).default("pergunta"),
    texto: z.string().trim().min(1, "Escreva a mensagem que você recebeu.").max(4000),
    contextoExtra: optionalText(1000).default(""),
    kind: z.enum(["casual", "argumento", "persona", "formal"]).default("casual"),
    stance: z.enum(["concordar", "discordar", "neutro", "curioso"]).optional(),
    tracos: z.array(z.string().trim().max(100)).max(MAX_TRAITS).default([]),
    emoji: z.boolean().default(false),
    variacoes: z.preprocess(
      (value) => (value === null || value === "" ? undefined : value),
      z.coerce.number().int().min(1).max(4).default(1),
    ),
    perfil: profileSchema,
    provider: providerEnum.default("auto"),
    model: optionalText(200).default(""),
    temperature: z.preprocess(
      (value) => (value === null || value === "" ? undefined : value),
      z.coerce.number().min(0).max(1.5).default(0.9),
    ),
  })
  .superRefine((data, context) => {
    if (data.mode === "pergunta" && data.stance) {
      context.addIssue({
        code: "custom",
        path: ["stance"],
        message: "A posição só é usada no modo afirmação.",
      });
    }
  })
  .strip();

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export function parseGenerateRequest(raw: unknown) {
  return generateRequestSchema.safeParse(raw);
}

export function validationErrorText(error: z.ZodError) {
  const first = error.issues[0];
  if (!first) return "Requisição inválida.";
  return first.message || `Campo ${first.path.join(".")} é inválido.`;
}

export function normalizeGenerateRequest(data: GenerateRequest) {
  return {
    mode: data.mode satisfies Mode,
    texto: data.texto,
    contextoExtra: data.contextoExtra,
    kind: data.kind satisfies TextKind,
    stance: data.stance satisfies Stance | undefined,
    tracos: sanitizeTraits(data.tracos),
    emoji: data.emoji,
    variacoes: data.variacoes,
    perfil: {
      nome: data.perfil.nome,
      descricao: data.perfil.descricao,
      exemplos: data.perfil.exemplos,
    },
    provider: data.provider satisfies "auto" | ProviderId,
    model: data.model,
    temperature: data.temperature,
  };
}

const kindSchema = z.enum(["casual", "argumento", "persona", "formal"]).default("casual");
const temperatureSchema = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.coerce.number().min(0).max(1.5).default(0.9),
);

const ajusteBase = {
  kind: kindSchema,
  provider: providerEnum.default("auto"),
  model: optionalText(200).default(""),
  temperature: temperatureSchema,
};

export const ajusteRequestSchema = z.discriminatedUnion("acao", [
  z
    .object({
      acao: z.literal("tom"),
      tom: z.enum(TONES),
      texto: z.string().trim().min(1, "Nada para reescrever.").max(2000),
      contexto: optionalText(1000).default(""),
      tracos: z.array(z.string().trim().max(100)).max(MAX_TRAITS).default([]),
      emoji: z.boolean().default(false),
      perfil: profileSchema,
      ...ajusteBase,
    })
    .strip(),
  z
    .object({
      acao: z.literal("analise"),
      texto: z.string().trim().min(1, "Cole a mensagem que você recebeu.").max(4000),
      contexto: optionalText(4000).default(""),
      ...ajusteBase,
    })
    .strip(),
]);

export type AjusteRequest = z.infer<typeof ajusteRequestSchema>;

export function parseAjusteRequest(raw: unknown) {
  return ajusteRequestSchema.safeParse(raw);
}

export function normalizeAjusteRequest(data: AjusteRequest) {
  if (data.acao === "analise") return data;
  return { ...data, tracos: sanitizeTraits(data.tracos) };
}

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido.");

export const conversaRequestSchema = z
  .object({
    modo: z.enum(["responder", "iniciar"]).default("responder"),
    mensagens: z
      .array(
        z.object({
          eu: z.boolean(),
          nome: z.string().trim().max(80).default(""),
          texto: z.string().trim().min(1).max(1000),
          hora: timeSchema.optional(),
        }),
      )
      .max(MAX_CONVERSATION, `Use no máximo ${MAX_CONVERSATION} mensagens.`),
    nomeOutro: optionalText(80).default(""),
    agora: z.preprocess((value) => (value === "" || value === null ? undefined : value), timeSchema.optional()),
    objetivo: optionalText(300).default(""),
    kind: z.enum(["casual", "argumento", "persona", "formal"]).default("casual"),
    tracos: z.array(z.string().trim().max(100)).max(MAX_TRAITS).default([]),
    emoji: z.boolean().default(false),
    perfil: profileSchema,
    provider: providerEnum.default("auto"),
    model: optionalText(200).default(""),
    temperature: z.preprocess(
      (value) => (value === null || value === "" ? undefined : value),
      z.coerce.number().min(0).max(1.5).default(0.9),
    ),
  })
  .superRefine((data, context) => {
    if (data.modo === "responder") {
      if (!data.mensagens.length)
        context.addIssue({ code: "custom", path: ["mensagens"], message: "Cole a conversa." });
      else if (!data.mensagens.some((item) => !item.eu))
        context.addIssue({
          code: "custom",
          path: ["mensagens"],
          message: "A conversa precisa ter mensagem da outra pessoa.",
        });
    } else if (!data.mensagens.length && !data.nomeOutro) {
      context.addIssue({ code: "custom", path: ["nomeOutro"], message: "Diga com quem você quer puxar assunto." });
    }
  })
  .strip();

export type ConversaRequest = z.infer<typeof conversaRequestSchema>;

export function parseConversaRequest(raw: unknown) {
  return conversaRequestSchema.safeParse(raw);
}

export function normalizeConversaRequest(data: ConversaRequest) {
  return {
    modo: data.modo,
    mensagens: data.mensagens,
    nomeOutro: data.nomeOutro,
    agora: data.agora ?? "",
    objetivo: data.objetivo,
    kind: data.kind satisfies TextKind,
    tracos: sanitizeTraits(data.tracos),
    emoji: data.emoji,
    perfil: {
      nome: data.perfil.nome,
      descricao: data.perfil.descricao,
      exemplos: data.perfil.exemplos,
    },
    provider: data.provider satisfies "auto" | ProviderId,
    model: data.model,
    temperature: data.temperature,
  };
}
