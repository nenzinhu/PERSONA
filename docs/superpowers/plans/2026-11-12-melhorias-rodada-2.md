# Melhorias — rodada 2 (10 ideias + bônus)

> Execução inline nesta sessão, na ordem de impacto combinada com o usuário. Checkboxes marcam o progresso.

**Goal:** entregar as dez ideias aprovadas e o bônus da jornada de treino, preservando as nove áreas existentes.

**Architecture:** lógica pura em `lib/` (backup, lembretes, patrulha, biblioteca, linha do tempo, correções, jornada) testada com `node --test`; componentes novos reaproveitam os painéis e tokens de `app/globals.css`; estado em `useLocalState`/`useSessionState`. Nenhuma rota de API nova.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, `localStorage`/`sessionStorage`, Web Speech API, `@media print`.

## Tasks

- [x] 5. Backup local em JSON com restauração e versão anonimizada (`lib/backup.ts`, `components/BackupManager.tsx`).
- [x] 2. Compromissos com data de vencimento e lembretes locais (`lib/reminders.ts`, painel em `DecisionWorkspace`).
- [x] 1. Biblioteca de respostas com etiquetas e busca (`lib/snippets.ts`, `components/ResponseLibrary.tsx`).
- [x] 8. Continuidade de ordens de serviço por número (`lib/service-order.ts`, painel em `ServiceOrderReport`).
- [x] 3. Linha do tempo da conversa só com o que o horário mostra (`lib/timeline.ts`, painel em `Conversation`).
- [x] 6. Correções pessoais aplicadas ao copiar (`lib/corrections.ts`, `components/CorrectionsPanel.tsx`, `ResultCard`).
- [x] 10. Atalhos da PWA (`app/manifest.ts`), link `?area=` e modo foco com saída por Esc (`app/page.tsx`).
- [x] 4. Ditado pelo reconhecimento de fala do navegador (`components/DictateButton.tsx` em Pergunta/Afirmação e Conversa).
- [x] 9. Comparação A/B com a nota “parece você” (`components/ResponseCompare.tsx` no Generator).
- [x] 7. Pausa de revisão antes de copiar textos com marcas de distorção (`ResultCard` + `FranklPauseModal`).
- [x] Bônus. Jornada de treino com média, tendência e recorte por situação (`lib/training-journal.ts`, painel no `Simulator`).

## Notas

- Nada nesta rodada chama IA: as únicas chamadas continuam sendo as rotas já existentes.
- A pausa antes de copiar usa as regras de distorção já existentes e libera a cópia depois da contagem, sem bloquear.
- A linha do tempo ignora horários que voltam no dia (conversa que virou a noite) para não inventar intervalo.
