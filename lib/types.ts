import type { HumanizeOptions } from "./humanize.ts";
import type { ModelInfo, ProviderId, TextKind } from "./providers.ts";
import type { StyleProfile } from "./prompt.ts";
import { DEFAULT_HUMANIZE } from "./humanize.ts";

export interface ProviderStatus {
  id: ProviderId;
  label: string;
  site: string;
  freeTier: string;
  configured: boolean;
  models: ModelInfo[];
}

export interface Settings {
  provider: "auto" | ProviderId;
  model: string;
  kind: TextKind;
  humanize: HumanizeOptions;
  emoji: boolean;
  variacoes: number;
  tracos: string[];
  telefone: string;
  temperatura: number;
}

export const DEFAULT_SETTINGS: Settings = {
  provider: "auto",
  model: "",
  kind: "casual",
  humanize: DEFAULT_HUMANIZE,
  emoji: false,
  variacoes: 2,
  tracos: [],
  telefone: "",
  temperatura: 0.9,
};

export const DEFAULT_PROFILE: StyleProfile = {
  nome: "",
  descricao: "",
  exemplos: [],
};

export interface GeneratedHistoryItem {
  id: string;
  mode: "pergunta" | "afirmacao";
  texto: string;
  respostas: string[];
  providerLabel: string;
  model: string;
  createdAt: string;
}
