# Fora da bolha — plano de implementação

> Execução inline nesta sessão (pedido do usuário: implementar o que faltava). Checkboxes marcam o progresso.

**Goal:** entregar as cinco ideias de `docs/ideias-fora-da-bolha.md` sem depender de IA, preservando as oito áreas existentes.

**Architecture:** lógica pura em `lib/` (energia, passagem de bastão, leitura sem contexto, acordos, cartão de bolso) testada com `node --test`; uma área nova com cinco seções internas em `components/`; estado em `useSessionState` (textos) e `useLocalState` (acordos). Nenhuma rota API nova.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, `sessionStorage`/`localStorage`, `@media print`.

**Spec:** `docs/ideias-fora-da-bolha.md`.

## Global constraints

- Sem dependência nova e sem chamada a provedor de IA nesta área.
- Nada é classificado nem interpretado automaticamente: o usuário escolhe tipo de item, significado e limite.
- Preservar tokens de `DESIGN.md` e os padrões de `app/globals.css`.

## Tasks

- [x] 1. Testar e implementar `lib/energy.ts` (disponibilidade, assunto, retorno e limite, sem justificativa criada).
- [x] 2. Testar e implementar `lib/handoff.ts` (linhas da conversa, itens por tipo, origem preservada e cartão final).
- [x] 3. Testar e implementar `lib/plain-read.ts` (pedido, prazo, referências soltas e o que segue em aberto).
- [x] 4. Testar e implementar `lib/agreements.ts` (expressões ambíguas, significado combinado e pergunta de precisão).
- [x] 5. Testar e implementar `lib/pocket.ts` (listas de dizer, perguntar e limite).
- [x] 6. Montar a área `Fora da bolha` com cinco seções, navegação em Mais e estilos, incluindo impressão do cartão.
- [x] 7. Rodar typecheck, lint, testes, Prettier e build; conferir no navegador claro/escuro, mobile e impressão.

## Notas

- A área usa as abas internas e os dois painéis de Comunicação na prática; o cartão de bolso imprime apenas a si mesmo.
- A leitura sem contexto usa limites de palavra Unicode (o `\b` do JavaScript é ASCII e falharia em “lá”, “até”, “terça”).
