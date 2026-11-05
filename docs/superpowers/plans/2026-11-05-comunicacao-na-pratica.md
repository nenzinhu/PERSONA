# Comunicação na prática — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Adicionar ensaio oral com revisão de transcrição, diário local de reflexão e informes manuais de ordem de serviço com foto para WhatsApp.

**Architecture:** Uma nova área da navegação hospeda três seções internas com componentes separados. Diário usa `useLocalState`; rascunho de ordem usa `useSessionState`; áudio e foto ficam em memória. O texto da OS é montado localmente e compartilhado com arquivo via Web Share API ou por cópia/download para WhatsApp Web. O ensaio oral usa a rota existente de transcrição após ação explícita; a revisão textual recebe somente transcrição, objetivo e autoavaliação.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Zod, `localStorage`, `MediaRecorder`, rota Groq de transcrição existente.

**Spec:** `docs/superpowers/specs/2026-11-05-comunicacao-na-pratica-design.md`

## Global Constraints

- Preservar o design e tokens em `DESIGN.md` e `app/globals.css`.
- Interface PT-BR; não introduzir dependências.
- Não salvar áudio, enviar conteúdo sem ação explícita nem inferir atributos vocais.
- Rotas de IA continuam protegidas e validadas conforme os padrões atuais.

## Review Focus

- Permissão de microfone negada ou `MediaRecorder` indisponível: mostrar recuperação e manter o restante da área acessível.
- Áudio excede 4 MB ou a transcrição falha: preservar a gravação para ouvir/apagar e orientar como tentar novamente.
- A revisão só recebe texto e deve preservar o texto da transcrição em caso de erro.
- Navegar entre seções não perde o diário salvo nem o rascunho da OS durante a sessão.
- Falha ou cancelamento no menu de compartilhamento não deve apagar o rascunho nem indicar que a mensagem foi enviada.
- Foto nunca é persistida nem enviada a uma API do Persona.

---

### Task 1: Revisão textual do ensaio

**Files:**

- Create: `lib/speech.ts`
- Modify: `lib/validation.ts`
- Create: `app/api/ensaio-fala/route.ts`
- Modify: `lib/api.ts`

- [x] Definir schema Zod para transcrição, objetivo, autoavaliação e campos de provedor.
- [x] Criar prompt/parser que retornem mensagem principal, ponto a esclarecer e pergunta de ensaio, sem avaliação vocal.
- [x] Adicionar função cliente que envia apenas transcrição e contexto selecionado.

### Task 2: Ensaio oral

**Files:**

- Create: `components/SpeechRehearsal.tsx`
- Modify: `app/globals.css`, `next.config.ts`

- [x] Implementar gravação temporária com limite de duração/tamanho, reprodução local, transcrição explícita pelo endpoint existente e descarte do áudio ao sair.
- [x] Exibir claramente os envios de áudio ao Groq e de texto ao provedor escolhido.
- [x] Permitir autoavaliação e revisão textual opcional, preservando a transcrição se houver erro.

### Task 3: Diário

**Files:**

- Create: `components/ConversationJournal.tsx`
- Modify: `app/globals.css`

- [x] Criar, editar e excluir entradas manuais com situação, objetivo, resultado, ponto positivo e prática futura.
- [x] Persistir localmente e listar da mais recente para a mais antiga, com controles de estados vazios e de salvamento.

### Task 4: Informe de ordem de serviço

**Files:**

- Create: `components/ServiceOrderReport.tsx`
- Delete: `components/MeetingPrep.tsx`
- Modify: `app/globals.css`

- [x] Montar informe editável local para início, andamento ou encerramento, com identificação da OS e relato informado pelo usuário.
- [x] Exigir foto temporária para compartilhamento e usar menu nativo ou fallback de cópia/download para WhatsApp Web.

### Task 5: Integração e documentação

**Files:**

- Create: `components/CommunicationStudio.tsx`
- Modify: `app/page.tsx`, `PRODUCT.md`, `README.md`

- [x] Adicionar uma área “Comunicação na prática” e suas três seções internas.
- [x] Documentar armazenamento local, processamento de áudio/transcrição e limites da revisão de fala.
