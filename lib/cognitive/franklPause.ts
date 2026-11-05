export interface EmotionalLoadResult {
  score: number; // 0 a 100
  requiresPause: boolean;
  reason?: string;
}

export function calculateEmotionalLoad(contextText: string, draftText: string): EmotionalLoadResult {
  let score = 0;

  const highStressGradients =
    /(urgente|erro|cancelar|problema|inaceitável|atraso|demissão|absurdo|justificar|culpado)/gi;
  const matchesContext = (contextText.match(highStressGradients) || []).length;
  const matchesDraft = (draftText.match(highStressGradients) || []).length;

  score += matchesContext * 20;
  score += matchesDraft * 15;

  if (draftText.includes("!!!") || draftText.includes("???")) score += 25;
  if (draftText.length > 50 && draftText.toUpperCase() === draftText) score += 40;

  return {
    score: Math.min(score, 100),
    requiresPause: score >= 50,
    reason: score >= 50 ? "Mensagem com alta densidade de tensão emocional detectada." : undefined,
  };
}
