// P-115 / P-18: texto padrão de patrulhamento por rodovia, acesso ou ponte.
export const PATROL_OPERATIONS = [
  { id: "P-115", label: "P-115" },
  { id: "P-18", label: "P-18" },
] as const;

export type PatrolOperation = (typeof PATROL_OPERATIONS)[number]["id"];

export interface PatrolPlace {
  id: string;
  /** O que aparece no seletor. */
  label: string;
  /** Trecho usado no texto, já com a preposição correta. */
  phrase: string;
  group: "Florianópolis" | "Pontes" | "Grande Florianópolis e vizinhas";
  kind: "rodovia" | "acesso" | "ponte";
}

export const PATROL_PLACES: PatrolPlace[] = [
  ...["SC-400", "SC-401", "SC-402", "SC-403", "SC-404", "SC-405", "SC-406"].map((rodovia) => ({
    id: rodovia.toLowerCase(),
    label: rodovia,
    phrase: `na ${rodovia}`,
    group: "Florianópolis" as const,
    kind: "rodovia" as const,
  })),
  {
    id: "acesso-aeroporto",
    label: "Acesso Aeroporto Internacional Hercílio Luz",
    phrase: "no Acesso Aeroporto Internacional Hercílio Luz",
    group: "Florianópolis",
    kind: "acesso",
  },
  {
    id: "acesso-tapera",
    label: "Acesso Florianópolis (Tapera)",
    phrase: "no Acesso Florianópolis (Tapera)",
    group: "Florianópolis",
    kind: "acesso",
  },
  {
    id: "ponte-hercilio-ilha",
    label: "Ponte Hercílio Luz — Cabeceira Ilha (sentido Continente)",
    phrase: "na Ponte Hercílio Luz, Cabeceira Ilha, sentido Continente",
    group: "Pontes",
    kind: "ponte",
  },
  {
    id: "ponte-hercilio-continente",
    label: "Ponte Hercílio Luz — Cabeceira Continente (sentido Ilha)",
    phrase: "na Ponte Hercílio Luz, Cabeceira Continente, sentido Ilha",
    group: "Pontes",
    kind: "ponte",
  },
  {
    id: "ponte-colombo",
    label: "Ponte Colombo Machado Salles — Cabeceira Ilha (sentido Continente)",
    phrase: "na Ponte Colombo Machado Salles, Cabeceira Ilha, sentido Continente",
    group: "Pontes",
    kind: "ponte",
  },
  {
    id: "ponte-pedro-ivo",
    label: "Ponte Pedro Ivo Campos — Cabeceira Continente (sentido Ilha)",
    phrase: "na Ponte Pedro Ivo Campos, Cabeceira Continente, sentido Ilha",
    group: "Pontes",
    kind: "ponte",
  },
  ...[
    ["sc-281", "SC-281"],
    ["sc-407", "SC-407"],
    ["sc-410", "SC-410"],
  ].map(([id, label]) => ({
    id,
    label,
    phrase: `na ${label}`,
    group: "Grande Florianópolis e vizinhas" as const,
    kind: "rodovia" as const,
  })),
];

export const PATROL_GROUPS = ["Florianópolis", "Pontes", "Grande Florianópolis e vizinhas"] as const;

export const PATROL_SUFFIX = "visando fluidez viária e prevenção de sinistros.";

export interface PatrolDraft {
  operacao: PatrolOperation;
  viatura: string;
  destino: string;
  km: string;
}

/** Pontes não usam km no texto padrão. */
export function placeUsesKm(place: PatrolPlace | undefined) {
  return place ? place.kind !== "ponte" : false;
}

export function findPlace(id: string) {
  return PATROL_PLACES.find((place) => place.id === id);
}

export function isPatrolVehicle(value: string) {
  return /^\d{4}$/.test(value.trim());
}

/** Mantém apenas dígitos e uma vírgula para o km. */
export function sanitizeKm(value: string) {
  const cleaned = value
    .replace(/[^\d,]/g, "")
    .replace(/,/g, ";")
    .replace(/;/g, ",");
  const [whole, ...rest] = cleaned.split(",");
  return rest.length ? `${whole.slice(0, 4)},${rest.join("").slice(0, 1)}` : whole.slice(0, 4);
}

/** Texto vazio quando faltar operação, local ou viatura de quatro dígitos. */
export function buildPatrolText(draft: PatrolDraft): string {
  const place = findPlace(draft.destino);
  const operacao = PATROL_OPERATIONS.find((item) => item.id === draft.operacao);
  if (!place || !operacao || !isPatrolVehicle(draft.viatura)) return "";

  const km = sanitizeKm(draft.km);
  const kmText = placeUsesKm(place) ? `, km ${km || "-"}` : "";
  return `Viatura PM-${draft.viatura.trim()} realizando ${operacao.id} ${place.phrase}${kmText}, ${PATROL_SUFFIX}`;
}

export function patrolIsReady(draft: PatrolDraft) {
  return Boolean(buildPatrolText(draft));
}
