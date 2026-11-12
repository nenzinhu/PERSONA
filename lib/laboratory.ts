export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}

export function compressionStats(original: string, draft: string, budget: number) {
  const before = wordCount(original);
  const after = wordCount(draft);
  return {
    before,
    after,
    reduction: before ? Math.round((1 - after / before) * 100) : 0,
    ready: before > 0 && after > 0 && after <= budget,
  };
}

export function buildRepair(action: string, impact: string, next: string): string {
  if (![action, impact, next].every((value) => value.trim())) return "";
  return `Quero reconhecer o que fiz: ${action.trim()}. Entendo o impacto que você relatou: ${impact.trim()}. Minha proposta para reparar é: ${next.trim()}. Isso ajudaria? Você pode me dizer se precisa de algo diferente.`;
}

export function buildRealityCheck(fact: string, story: string, alternative: string, question: string): string {
  return `Observação: ${fact.trim()}\nInterpretação (não confirmada): ${story.trim()}\nOutra possibilidade: ${alternative.trim()}\nPergunta para conferir: ${question.trim()}`;
}

export function capsuleReady(revealAt: string, now: number): boolean {
  const time = Date.parse(revealAt);
  return Number.isFinite(time) && time <= now;
}
