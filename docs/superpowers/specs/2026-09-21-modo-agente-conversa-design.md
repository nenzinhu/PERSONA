# Modo agente de conversa (aba "Conversa")

Status: aprovado em 2026-09-21.

## Objetivo

Colar um trecho de conversa do WhatsApp, dizer (opcionalmente) o que quer alcançar e receber, numa única chamada à IA:

1. **Plano**: a estratégia da resposta em 1 linha.
2. **Resposta**: a mensagem a enviar, no seu estilo (humanizada, com nota "parece você").
3. **Réplicas**: as 2 réplicas mais prováveis da outra pessoa, cada uma com a sua tréplica pronta.

## 1. Entrada

- Texto colado das mensagens copiadas do WhatsApp: `[21:03, 21/09/2026] Ana: texto` (hora antes da data). Também aceita o formato do arquivo exportado e linhas simples `Nome: texto`. Linhas sem cabeçalho continuam a mensagem anterior.
- `parseConversation(raw)` em `lib/whatsapp.ts` devolve `ChatMessage[]`.
- A interface lista os remetentes em botões; você marca qual é você. A escolha fica salva (`localStorage`, chave `conversa-eu`). Se `perfil.nome` bater com um remetente, ele vem pré-selecionado.
- Objetivo opcional (até 300 caracteres).
- São usadas só as últimas 40 mensagens (`MAX_CONVERSATION`), cada uma com até 1000 caracteres. A interface avisa quando há corte e quando a última mensagem é sua.

## 2. Prompt e formato de saída

- `buildConversationMessages(input)` em `lib/prompt.ts` reutiliza as regras de estilo do `buildMessages` (nome, descrição, tipo de texto, traços, emoji, anti-IA e a regra dos blocos `<<<...>>>`) e os exemplos few-shot.
- A conversa vai num bloco `<<<CONVERSA>>>` com uma linha por mensagem: `Ana: ...` / `Você: ...`. O objetivo vai em `<<<OBJETIVO>>>`.
- A IA responde em seções de texto:

```
### PLANO
...
### RESPOSTA
...
### SE ELE(A) DISSER
...
### VOCÊ RESPONDE
...
(o par "SE ... DISSER" / "VOCÊ RESPONDE" se repete 2 vezes)
```

- `parseAgentOutput(raw)` devolve `{ plano, resposta, replicas: {deles, voce}[] }`. Os títulos são reconhecidos sem diferenciar maiúsculas e acentos, e tolerando `**`, `#` e numeração. Réplica sem tréplica é descartada. Se nenhum título for encontrado, o texto inteiro vira `resposta`. Se `resposta` ficar vazia, é erro (tenta o próximo provedor).

## 3. API

- `POST /api/conversa` com o corpo `{ mensagens: {eu, nome, texto}[], objetivo, kind, tracos, emoji, perfil, provider, model, temperature }`, validado com zod em `lib/validation.ts` (`conversaRequestSchema`).
- A senha, o rate limit, a escolha de provedor e modelo e o fallback em 429 ficam em `lib/generation.ts` (`runGeneration`), extraídos de `app/api/generate/route.ts`, que passa a usar a mesma função. O comportamento de `/api/generate` não muda.
- Resposta: `{ plano, resposta, replicas, provider, providerLabel, model, fallbacks }`.

## 4. Interface

- Nova aba **Conversa** entre "Afirmação" e "Meu estilo" (`components/Conversation.tsx`).
- Campos: conversa colada, botões de remetente ("sou eu"), objetivo e o botão Gerar/Cancelar.
- Usa as configurações que já existem (provedor, modelo, tipo, traços, humanização, emoji e telefone), ajustadas nas abas Pergunta e Afirmação.
- Resultado: o plano em destaque discreto, a resposta num `ResultCard` (humanização, nota, WhatsApp, copiar, salvar exemplo) e cada réplica como "Se Ana disser: …", com a tréplica num `ResultCard`.

## Testes

- `tests/whatsapp.test.ts`: formato copiado, várias linhas, `Nome: texto` e corte.
- `tests/prompt.test.ts`: `buildConversationMessages` (blocos, "Você:", objetivo) e `parseAgentOutput` (completo, variações de título, sem títulos, réplica incompleta).
- `tests/validation.test.ts`: o schema da conversa.
- Verificação no navegador com a resposta da API simulada, e build de produção.
