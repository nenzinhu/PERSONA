import { z } from "zod";
import { sanitizeTraits } from "./traits.ts";
import { MAX_EXAMPLES } from "./prompt.ts";
import { MAX_TRAITS } from "./traits.ts";
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
