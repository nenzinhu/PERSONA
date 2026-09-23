# Ideias 1 a 9: ler e ajustar, agente, áudio/print e simulador

Status: aprovado em 2026-09-22. Ordem de entrega: A → B → C → D (um commit por bloco).

## Base comum

- `parseSections(raw, headings)` em `lib/prompt.ts`: generaliza o leitor de títulos do modo agente (tolera `#`, `**`, numeração, acentos e maiúsculas; texto sem títulos → nada reconhecido). `parseAgentOutput` passa a usá-lo.
- `guard(req)` em `lib/generation.ts`: senha do app + rate limit, devolve `{ ok: true, headers }` ou a `NextResponse` de erro. `runGeneration` e as rotas de áudio/print usam.
- Todas as rotas validam com zod em `lib/validation.ts` e contam no mesmo rate limit.

## Bloco A — Ler e ajustar (ideias 3, 4, 5)

- `POST /api/ajuste` com `acao`:
  - `tom`: `{ texto (≤2000), tom: curto|carinhoso|seco|engracado|formal, contexto? (≤1000), kind, tracos, emoji, perfil, provider, model, temperature }` → `{ texto }`. O prompt reutiliza as regras de estilo (`styleRules`) e os exemplos; o texto vai em `<<<RESPOSTA_ATUAL>>>`.
  - `analise`: `{ texto (≤4000), contexto? , provider, model, kind, temperature }` → `{ emocao, intencao, entrelinhas, cuidado }`, a partir das seções `### EMOÇÃO`, `### INTENÇÃO`, `### ENTRELINHAS`, `### CUIDADO`. Se nenhuma seção vier, é erro (tenta o próximo provedor).
- Interface:
  - `ResultCard` ganha a prop opcional `onTone(tom, textoAtual) => Promise<string>`. Com ela, mostra os botões de tom; o texto devolvido vira o novo `raw` do cartão (continua humanizado e com nota).
  - Componente `MessageReading` (botão "🌡️ Ler a mensagem" + cartão com o resultado) em Pergunta/Afirmação (lê o texto digitado) e Conversa (lê a última mensagem da outra pessoa, com as anteriores como contexto).
- Cliente: `lib/api.ts` com `postJson(url, body, senha, signal)` que trata erro e JSON.

## Bloco B — Mais do agente (ideias 6, 7, 9)

- `ChatMessage` ganha `hora?: string` (`HH:MM`) e `data?: string`, preenchidos nos formatos com cabeçalho.
- `/api/conversa` recebe `modo: responder|iniciar`, `agora` (`HH:MM`, opcional) e `nomeOutro` (≤80).
  - `responder`: como hoje (exige mensagem da outra pessoa).
  - `iniciar`: aceita 0 mensagens; exige `nomeOutro` quando não há mensagens. A IA escreve uma mensagem para abrir/reabrir o papo.
  - Cada mensagem vai ao prompt como `[21:03] Ana: ...` quando tem hora; `agora` vai em `<<<AGORA>>>`.
- Saída ganha `### QUANDO MANDAR` → campo `quando` (texto curto; vazio se a IA não mandar).
- Interface: seletor Responder / Puxar assunto; campo "Nome da pessoa" no modo iniciar sem conversa; chips de situação difícil (recusar convite, cobrar dinheiro, pedir desculpa, remarcar, dizer não ao chefe, terminar) que preenchem o objetivo; o resultado mostra "⏰ Quando mandar".

## Bloco C — Novas entradas (ideias 1, 2)

- Áudio: `POST /api/transcrever` (multipart, campo `audio`, ≤4 MB, tipos audio/*) → Groq `/audio/transcriptions` com `TRANSCRIBE_MODEL` (padrão `whisper-large-v3-turbo`), `language=pt` → `{ texto }`. Sem `GROQ_API_KEY` → 400 com mensagem clara. Botão "🎤 Áudio" (input de arquivo) em Pergunta/Afirmação (preenche a mensagem) e Conversa (acrescenta `Nome: texto` como mensagem da outra pessoa, ou texto puro se não houver remetentes).
- Print: `POST /api/ler-print` com `{ imagens: dataURL JPEG[] (1–3, cada ≤1,5 MB) }` → modelo de visão (`VISION_PROVIDER` + `VISION_MODEL`; padrão: primeiro configurado entre Mistral `mistral-small-latest` e Groq `meta-llama/llama-4-scout-17b-16e-instruct`) → linhas `Nome: texto`, bolhas da direita como `Eu`. Resposta `{ texto }` colada na caixa da Conversa, com "Eu" pré-marcado como você. O navegador reduz a imagem para 1600 px, JPEG 0,85.
- `lib/llm.ts`: o conteúdo das mensagens aceita partes `text`/`image_url` (formato OpenAI).
- Os ids de visão/transcrição podem mudar; ficam configuráveis por env e documentados no README e `.env.example`.

## Bloco D — Simulador (ideia 8)

- Nova aba "Treino" entre Conversa e Meu estilo (`components/Simulator.tsx`).
- Configuração: nome da pessoa, como ela é (≤500), situação/objetivo (≤300), ou "usar a conversa da aba Conversa" (não compartilhado entre abas: o usuário cola ali mesmo, opcional).
- `POST /api/simular` com `{ acao: responder|avaliar, pessoa: {nome, jeito, situacao}, historico: {eu, texto}[] (≤30), provider, model, kind, temperature, perfil }`:
  - `responder`: a IA fala como a pessoa → `{ texto }`.
  - `avaliar`: `### FUNCIONOU`, `### MELHORAR`, `### NOTA` (0–10) → `{ funcionou, melhorar, nota }`.
- "💡 Me ajuda" chama `/api/conversa` (modo responder) com o histórico simulado e preenche o campo com a resposta sugerida.
- Estado só em memória (`useState`); Recomeçar limpa.

## Testes

- Unitários: `parseSections`, parse de hora, prompts e parsers de ajuste/análise/agente/simulador, schemas novos, montagem da requisição de visão.
- Navegador: fluxo de cada bloco com `fetch` das rotas simulado; console sem erros.
- `typecheck`, `lint`, `test`, `format:check` e `build` antes de cada commit.
