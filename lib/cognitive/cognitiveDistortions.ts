export interface DistortionRule {
  id: string;
  name: string;
  pattern: RegExp;
  suggestion: string;
  psychologicalInsight: string;
}

export const COGNITIVE_DISTORTIONS: DistortionRule[] = [
  {
    id: "mind_reading",
    name: "Leitura de Mente Presumida",
    pattern: /(ele|ela|eles|elas|o cliente|o chefe) vai (achar|pensar|odiar|ignorar|cancelar|reclamar)/i,
    suggestion: "Substitua a suposição sobre o sentimento do outro por um fato objetivo ou pergunta clara.",
    psychologicalInsight: "Beck (TCC): Você está reagindo à sua projeção sobre o outro, não ao que foi dito.",
  },
  {
    id: "catastrophizing",
    name: "Catastrofização / Tudo ou Nada",
    pattern: /(tudo vai dar errado|nunca mais|impossível resolver|perda total|sempre acontece isso)/i,
    suggestion: "Reduza a escala do impacto. Qual é a ação imediata sob seu controle?",
    psychologicalInsight: "Beck (TCC): Interrompa o ciclo amplificador da amígdala focando nos fatos imediatos.",
  },
  {
    id: "passive_aggressive",
    name: "Entrelinha Defensiva / Act-Out",
    pattern: /(como você quiser|faça como achar melhor, mas|se você diz|não me responsabilizo)/i,
    suggestion: "Declare o seu limite abertamente em vez de usar encerramento passivo-agressivo.",
    psychologicalInsight: "Freud (Psicanálise): O ato falho verbal indica ressentimento acumulado não expresso.",
  },
];

export function analyzeDraftDistortions(text: string): DistortionRule[] {
  if (!text || !text.trim()) return [];
  return COGNITIVE_DISTORTIONS.filter((rule) => rule.pattern.test(text));
}
