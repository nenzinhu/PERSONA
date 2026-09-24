# Gerador de Respostas

Gera respostas para **perguntas** e **afirmações** (abas separadas) escritas do seu jeito: abreviações (vc, pq, tb), porcentagem de erro de digitação, traços de personalidade e exemplos reais seus. Botões para **WhatsApp**, **Copiar** e **Compartilhar**.

Next.js 15 (App Router) · sem banco de dados · deploy no Vercel.

## Abas

| Aba            | O que faz                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Pergunta**   | Cole a pergunta que te fizeram → respostas prontas.                                                              |
| **Afirmação**  | Cole o que te disseram e escolha a posição: concordar, discordar, neutro, curioso.                               |
| **Conversa**   | Cole a conversa (ou um print) → plano, resposta, prováveis réplicas e quando mandar. Também puxa assunto.        |
| **Treino**     | A IA faz o papel da outra pessoa para você ensaiar uma conversa difícil; no fim, avalia como você foi.           |
| **Meu estilo** | Seu nome, como você escreve, exemplos reais, importação de conversa do WhatsApp e export JSONL para fine-tuning. |
| **Modelos**    | Qual modelo é o mais recomendado para cada tipo de texto e quais provedores têm chave.                           |

### Ajudas extras

- **Botões de tom** em cada resposta: mais curto, carinhoso, seco, engraçado ou formal.
- **🌡️ Ler a mensagem**: emoção, intenção, entrelinhas e o que evitar ao responder.
- **🎤 Áudio**: transcreve o áudio do WhatsApp (.opus/.ogg/.m4a, até 4 MB) com o Whisper do Groq.
- **📷 Print** (aba Conversa): lê até 3 prints da conversa com um modelo de visão.
- **Conversa**: modo _Puxar assunto_, atalhos de situação difícil (cobrar, recusar, terminar…) e ⏰ _quando mandar_.

### "Parecer que fui eu"

- **Abreviações** 0–100%: você→vc, porque→pq, também→tb, hoje→hj, para→pra, está→tá, fim de semana→fds…
- **Erros de digitação** 0–20% das palavras: tirar acento, trocar letras vizinhas, comer letra, letra dobrada, tecla do lado.
- Sem ponto final e minúscula no início, risada → kkkk, emoji opcional.
- Remove marcas de IA (listas, negrito, travessão —, "Claro!", "Ótima pergunta").
- **Embaralhar** sorteia outros erros sem gastar uma nova chamada ao modelo.
- **Personalidade**: até 6 traços positivos/negativos (empático, sarcástico, impaciente…).

## Provedores (todos com opção grátis)

| Provedor         | Variável                                               | Melhor para                                                                                                                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Groq**         | `GROQ_API_KEY`                                         | ⭐ **Padrão recomendado.** Zap curto: Qwen 3.6 27B, resposta em <1s. Também GPT-OSS 120B/20B, Compound, Compound Mini.               |
| **Nous Portal**  | `NOUS_API_KEY`                                         | ⭐ **DeepSeek V4 Flash**: o mais completo (opinião e imitar estilo). Também LongCat 2.0, Qwen 3.7 Flash, Mistral Nemo, Llama 3.1 8B… |
| **NVIDIA NIM**   | `NVIDIA_API_KEY`                                       | Nemotron 3 Super 120B: rebater afirmações e textos formais.                                                                          |
| **Mistral**      | `MISTRAL_API_KEY`                                      | Ministral 14B/8B/3B: PT-BR natural e rápido.                                                                                         |
| **AnyAPI**       | `ANYAPI_API_KEY`                                       | Dots 3 Note e Nemotron 3 Nano Omni (free).                                                                                           |
| **OrcaRouter**   | `ORCAROUTER_API_KEY`                                   | DeepSeek V4 Flash, GLM 5.3 Flash e Hunyuan 3 (free).                                                                                 |
| **OpenRouter**   | `OPENROUTER_API_KEY`                                   | Nemotron 3 Super (free), `openrouter/free` como reserva automática, Nex, Dots, LFM…                                                  |
| **Together AI**  | `TOGETHER_API_KEY`                                     | Llama 3.3 70B Turbo Free; DeepSeek R1 Distill 70B Free (lento).                                                                      |
| **Cloudflare**   | `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`       | Workers AI (10 mil neurons/dia): Llama 3.3 70B Fast, Mistral Small 3.1, Llama 4 Scout, Gemma 3.                                      |
| **Cohere**       | `COHERE_API_KEY`                                       | Command A (ótimo para rebater e formal) e Command R7B. Chave de teste grátis.                                                        |
| **Hugging Face** | `HUGGINGFACE_API_KEY`                                  | Créditos mensais: Qwen 3 235B, DeepSeek V3, Llama 3.3 70B, Gemma 3 27B.                                                              |
| **ModelScope**   | `MODELSCOPE_API_KEY`                                   | Chamadas grátis por dia: Qwen 3 235B, DeepSeek V3.1, Kimi K2, Qwen 3 32B.                                                            |
| **AIHubMix**     | `AIHUBMIX_API_KEY`                                     | Modelos -free (Gemini 2.0 Flash, GPT-4.1). Ids mudam: ajuste com `AIHUBMIX_MODELS`.                                                  |
| **Meu modelo**   | `CUSTOM_API_KEY` + `CUSTOM_BASE_URL` + `CUSTOM_MODELS` | Seu fine-tune (Ollama/HF/Together). Vira o recomendado para persona.                                                                 |

Modelos de código (Codestral, Laguna, North Mini Code), de domínio (Ling Saúde/Finanças) e o ALLaM (árabe) ficam na lista, mas com nota baixa: não servem bem para conversa em PT-BR.

**Resumo da recomendação**

- Resposta curta de WhatsApp → **Groq · Qwen 3.6 27B** (alternativa: Mistral · Ministral 14B)
- Rebater afirmação / opinião → **DeepSeek V4 Flash** (Nous ou OrcaRouter free) ou **GLM 5.3 Flash**
- Soar exatamente como você → **DeepSeek V4 Flash** ou **Mistral Nemo** (ou o seu fine-tune)
- Formal / trabalho → **Groq · GPT-OSS 120B** ou **Nemotron 3 Super**, com abreviação e erro em 0%

No modo **Automático** o app escolhe o melhor modelo que tiver chave e, se o limite grátis estourar (HTTP 429), tenta o próximo sozinho.

> As listas de modelos grátis mudam. Sobrescreva com `<PROVIDER>_MODELS=id1,id2` (ex.: `GROQ_MODELS`) sem mexer no código, ou digite o id no campo _Modelo_.

## Rodar local

```bash
npm install
cp .env.example .env.local   # preencha ao menos GROQ_API_KEY
npm run dev
```

Testes (humanizador, WhatsApp, prompts, validação, provedores e rotas novas): `npm test`. Precisa de Node 22.6 ou mais novo.

## GitHub + Vercel

O código fica em [github.com/nenzinhu/PERSONA](https://github.com/nenzinhu/PERSONA) (branch `main`). Para baixar e publicar alterações:

```bash
git clone https://github.com/nenzinhu/PERSONA.git
cd PERSONA
git add .
git commit -m "descreva a mudança"
git push origin main
```

1. Vercel → **Add New Project** → importe o repositório `PERSONA` (framework detectado: Next.js). Cada push na `main` publica sozinho.
2. **Settings → Environment Variables**: cadastre as chaves de `.env.example` que for usar.
3. **Settings → Domains**: adicione seu domínio.
4. Recomendado em domínio público: defina `APP_PASSWORD` para que estranhos não gastem sua cota.

## Fine-tuning

Veja [finetune/README.md](finetune/README.md): exporte o JSONL na aba _Meu estilo_, treine LoRA no Colab grátis com Unsloth e conecte o modelo como _Meu modelo_.

## Segurança e operação

- A rota `/api/generate` valida o payload com schema, limita texto, exemplos, modelos e parâmetros e rejeita modelos fora do catálogo do provedor.
- Rate limit por janela (padrão: 20 requisições/minuto) pode ser ajustado com `RATE_LIMIT_MAX` e `RATE_LIMIT_WINDOW_MS`. A implementação atual é em memória; em deploy com várias instâncias, use um armazenamento compartilhado.
- O servidor tenta novamente provedores em falhas temporárias e faz fallback para os próximos modelos recomendados.
- Erros de provedor são normalizados para não expor detalhes internos.
- Exemplos e contexto são enviados ao modelo dentro de delimitadores e tratados como dados, reduzindo o risco de injeção de prompt.
- Headers de segurança, CSP, proteção contra clickjacking e política de permissões estão configurados em `next.config.ts`.
- `APP_PASSWORD` fica no servidor; a senha digitada no navegador é mantida apenas em `sessionStorage` e é recomendada em qualquer deploy público.

## Variáveis de ambiente

Além das chaves listadas acima, o app aceita:

| Variável               |                   Padrão | Função                                             |
| ---------------------- | -----------------------: | -------------------------------------------------- |
| `APP_PASSWORD`         |                    vazio | Senha opcional para proteger a rota de geração.    |
| `RATE_LIMIT_MAX`       |                     `20` | Requisições permitidas por janela.                 |
| `RATE_LIMIT_WINDOW_MS` |                  `60000` | Tamanho da janela em milissegundos.                |
| `<PROVIDER>_MODELS`    |         catálogo interno | Substitui a lista de modelos de um provedor.       |
| `TRANSCRIBE_MODEL`     | `whisper-large-v3-turbo` | Modelo do Groq para transcrever áudio (🎤).        |
| `VISION_PROVIDER`      |          Mistral ou Groq | Provedor do modelo de visão que lê prints (📷).    |
| `VISION_MODEL`         |       padrão do provedor | Id do modelo de visão (os ids mudam; ajuste aqui). |

Execute `npm run env:check` para conferir quais variáveis estão presentes sem imprimir seus valores.

## Qualidade e testes

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

A CI em `.github/workflows/ci.yml` (Node 22) executa checagem de ambiente, TypeScript, ESLint, formatação (Prettier), testes e build.

## Arquitetura

- `app/`: páginas e rotas API do Next.js App Router.
- `components/`: interface React e ações do usuário.
- `lib/`: provedores, prompts, humanização, persistência, datasets e validação.
- `finetune/`: treino LoRA opcional com Unsloth.
- `tests/`: testes unitários do humanizador, WhatsApp, datasets, validação, rate limit, prompts, provedores e estado.

O estado do navegador usa uma versão de schema e migrate automaticamente configurações antigas. O histórico recente de respostas também fica no `localStorage`, sem sair do dispositivo.

## Privacidade

- Perfil, exemplos, configurações e histórico ficam no `localStorage` do navegador; a senha do app fica apenas em `sessionStorage`.
- O servidor repassa o pedido ao provedor escolhido, então exemplos e contexto deixam o navegador durante a geração. Evite dados sensíveis.
- As chaves de API e URLs privadas dos provedores não são enviadas ao frontend.
- Evite importar conversas com dados sensíveis de terceiros e use a limpeza/anonimização antes de fazer fine-tuning.
