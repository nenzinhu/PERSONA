export type ArchetypeType = "Mediador" | "Técnico" | "Assertivo" | "Protetor" | "Neutro";

export interface ArchetypeAnalysis {
  archetype: ArchetypeType;
  description: string;
  color: string;
}

export function detectJungianArchetype(text: string): ArchetypeAnalysis {
  if (!text || text.trim().length < 10) {
    return { archetype: "Neutro", description: "Aguardando mais texto para análise.", color: "neutral" };
  }

  if (/(acordo|alinhamento|compreendo|vamos juntos|pontes|possibilidades)/i.test(text)) {
    return { archetype: "Mediador", description: "Foco na harmonia e na resolução pacífica.", color: "emerald" };
  }
  if (/(conforme norma|artigo|procedimento|dados|especificação|relatório)/i.test(text)) {
    return { archetype: "Técnico", description: "Foco na precisão lógica e factual.", color: "blue" };
  }
  if (/(inadmissível|prazo final|decisão tomada|exijo|limite|posição)/i.test(text)) {
    return { archetype: "Assertivo", description: "Foco no estabelecimento claro de limites.", color: "amber" };
  }
  if (/(garantir|segurança|suporte|cuidado|proteger|retaguarda)/i.test(text)) {
    return {
      archetype: "Protetor",
      description: "Foco na preservação e sustentabilidade do relacionamento.",
      color: "purple",
    };
  }

  return { archetype: "Neutro", description: "Estilo equilibrado sem dominância arquetípica.", color: "neutral" };
}
