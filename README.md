# Persona

Ajuda a responder mensagens do seu jeito e amplia a prática para fala, reflexão e preparação de encontros presenciais.

Next.js 15 (App Router) · sem banco de dados · deploy no Vercel.

## Abas

| Aba                        | O que faz                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Decidir e responder**    | Define objetivo e limites, revisa rascunhos com fontes, compara mensagens e acompanha pendências confirmadas.                     |
| **Pergunta**               | Cole a pergunta que te fizeram → respostas prontas.                                                                               |
| **Afirmação**              | Cole o que te disseram e escolha a posição: concordar, discordar, neutro, curioso.                                                |
| **Conversa**               | Cole a conversa (ou um print) → plano, resposta, prováveis réplicas e quando mandar. Também puxa assunto.                         |
| **Treino**                 | A IA faz o papel da outra pessoa para você ensaiar uma conversa difícil; no fim, avalia e guarda a nota na sua jornada de treino. |
| **Comunicação na prática** | Ensaie uma fala, registre uma reflexão, monte informes de ordem de serviço com foto e o texto de P-115/P-18 por rodovia ou ponte. |
| **Fora da bolha**          | Cinco ferramentas locais: pouca energia, passagem de bastão, rascunho sem contexto, acordos e cartão de bolso para imprimir.      |
| **Meu estilo**             | Seu nome, como você escreve, exemplos reais, biblioteca de respostas, correções pessoais, backup e export JSONL para fine-tuning. |
| **Modelos**                | Qual modelo é o mais recomendado para cada tipo de texto e quais provedores têm chave.                                            |

### Ajudas extras

- **Botões de tom** em cada resposta: mais curto, carinhoso, seco, engraçado ou formal.
- **🌡️ Ler a mensagem**: emoção, intenção, entrelinhas e o que evitar ao responder.
- **🎤 Áudio**: transcreve o áudio do WhatsApp (.opus/.ogg/.m4a, até 4 MB) com o Whisper do Groq.
- **📷 Print** (aba Conversa): lê até 3 prints da conversa com um modelo de visão.
- **🎙 Ditar**: o reconhecimento de fala do próprio navegador (pt-BR) escreve no campo da mensagem e da conversa, sem chave e sem IA do Persona.
- **Comparar A/B**: duas versões lado a lado com a nota “parece você” e o que difere, sem gastar chamada de IA.
- **Pausa antes de copiar**: se o texto tiver marcas de distorção (leitura de mente, catastrofizar…), a cópia abre a pausa de revisão com contagem antes de liberar.
- **Ritmo da conversa** (aba Conversa): mensagens por pessoa, maior intervalo e tempo médio de resposta, medidos só pelo horário colado — sem interpretar humor ou intenção.
- **Conversa**: modo _Puxar assunto_, atalhos de situação difícil (cobrar, recusar, terminar…) e ⏰ _quando mandar_.

### Comunicação na prática

- **Ensaio de fala:** grave até 60 segundos, ouça e escolha se quer transcrever. A transcrição usa o Groq quando você pede; a revisão opcional envia somente o texto, o objetivo e a autoavaliação ao provedor escolhido. A revisão trata do conteúdo escrito e não avalia voz, sotaque ou emoção. A gravação não é salva pelo Persona.
- **Diário:** registre manualmente o que queria alcançar, como a conversa aconteceu para você e o que tentará depois. As entradas ficam no `localStorage` deste navegador e não são enviadas à IA.
- **Ordem de serviço:** monte um informe de início, andamento ou encerramento com identificação da OS, data/hora, local, relato, observações e foto (obrigatória para compartilhar). O texto do rascunho fica na sessão do navegador; a foto fica apenas na memória. O compartilhamento abre o menu do dispositivo para você escolher WhatsApp e o grupo. Se não houver compartilhamento de arquivos, o texto é copiado e a foto baixada para anexar manualmente. Nada é enviado sem sua confirmação.
- **Minhas ordens de serviço:** guarde a OS pelo número e continue a próxima etapa depois; o painel mostra quantas seguem em aberto. Fica no `localStorage` deste navegador.
- **P-115 / P-18:** escolha a operação, o número da viatura, o km e a rodovia, o acesso ou a ponte (Florianópolis, Pontes e Grande Florianópolis). O texto sai no padrão “Viatura PM-0042 realizando P-115 na SC-400, km 12, visando fluidez viária e prevenção de sinistros.”, sem data e sem hora. Pontes não usam km. Copiar ou compartilhar; o rascunho fica só na sessão.

### Fora da bolha

Cinco ferramentas que funcionam sem IA, no próprio navegador. Textos ficam na sessão (ou no `localStorage`, quando indicado) e nada é compartilhado automaticamente — detalhes em [docs/ideias-fora-da-bolha.md](docs/ideias-fora-da-bolha.md).

- **Pouca energia:** escolha “consigo resolver agora”, “preciso de tempo” ou “não consigo assumir” e receba a frase pronta com assunto, prazo e limite. O app não cria justificativas.
- **Passagem de bastão:** a conversa colada vira itens revisáveis (fato, dúvida ou próxima ação), cada um com o trecho de origem, mais responsável e próxima ação no cartão final.
- **Sem contexto:** veja o rascunho isolado e quatro perguntas fixas sobre pedido, prazo, referências soltas e o que ficou em aberto.
- **Acordos:** registre o significado combinado de expressões como “mais tarde” e confira o texto; sem acordo registrado, o app só mostra a pergunta de precisão.
- **Cartão de bolso:** o que dizer, o que perguntar e o meu limite, em uma folha para imprimir (a impressão mostra apenas o cartão) ou copiar.

### Minhas respostas, correções e backup (aba Meu estilo)

- **Minhas respostas:** guarde respostas que funcionaram, com etiqueta (cobrar, recusar, confirmar, pedir prazo…) e busca. Copiar e remover; fica no `localStorage`.
- **Correções que eu sempre faço:** trocas aplicadas ao texto na hora de copiar (ex.: “mano” → “senhor”), com opção de desligar. Só o que você cadastrar.
- **Backup do Persona:** exporta e restaura um JSON com perfil, exemplos, configurações, histórico, diário, acordos, pendências, lembretes, biblioteca e correções; a versão anonimizada troca termos no formato “real = apelido”.

### "Parecer que fui eu"

- **Abreviações** 0–100%: você→vc, porque→pq, também→tb, hoje→hj, para→pra, está→tá, fim de semana→fds…
- **Erros de digitação** 0–20% das palavras: tirar acento, trocar letras vizinhas, comer letra, letra dobrada, tecla do lado.
- Sem ponto final e minúscula no início, risada → kkkk, emoji opcional.
- Remove marcas de IA (listas, negrito, travessão —, "Claro!", "Ótima pergunta").
- **Embaralhar** sorteia outros erros sem gastar uma nova chamada ao modelo.
- **Personalidade**: até 6 traços positivos/negativos (empático, sarcástico, impaciente…).

## Decidir e responder

Nova área com cinco ferramentas:

- **Objetivo e limites:** escolha responder, esclarecer, recusar, encerrar ou não responder. A última opção bloqueia a geração, sem bloquear análise.
- **Conferir rascunho:** compara fatos, promessas e condições com trechos das fontes e limites. Não verifica fatos externos nem garante correção.
- **Pendências confirmadas:** separa perguntas, pedidos e compromissos. O usuário revisa, marca confirmação e salva por assunto. Pode editar, concluir, reabrir, excluir e desfazer a exclusão.
- **Lembretes:** cada registro pode receber uma data de vencimento. O painel mostra o que venceu e o que vence hoje, com opção de avisar ao abrir o Persona (permissão do navegador). Nada é enviado a servidores.
- **Comparar mensagens:** mostra trechos divergentes das duas fontes e propõe uma pergunta de esclarecimento, sem decidir autoridade.
- **Contexto protegido:** substituições literais e revisadas de nomes/códigos por apelidos antes dos envios desta área, com restauração local. O mapa não vai à API. Não cobre outras abas, áudios ou prints e não garante anonimato.

Todos os envios dessa área têm uma prévia e exigem confirmação. Fontes, rascunho e mapa ficam em sessionStorage; registros confirmados ficam em localStorage. Registros só entram em análises do mesmo assunto se a opção estiver marcada. Nenhuma mensagem é enviada a terceiros automaticamente.

O **Span-01 Lite** (respan/span-01-lite:free) tem integração separada com a API Decisions do OpenRouter, em vez do endpoint de chat. Na avaliação opcional, apresenta estimativas de compromisso adicional, limite contrariado e condições preservadas. Requer OPENROUTER_API_KEY; não redige respostas.

## Instalar o Persona

Use **Instalar app** na navegação. Chrome/Edge oferecem o prompt nativo quando disponível; no Safari do iPhone/iPad, use Compartilhar → Adicionar à Tela de Início. Requer HTTPS ou localhost.

A PWA tem manifest, ícones próprios e uma página para falta de conexão. IA exige internet. O service worker guarda somente a página offline e ícones públicos, nunca chamadas de API, mensagens ou páginas do app.

## Provedores (todos com opção grátis)

| Provedor         | Variável                                               | Melhor para                                                                                                                                     |
| ---------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Groq**         | `GROQ_API_KEY`                                         | ⭐ **Padrão recomendado.** Zap curto: Qwen 3.8 27B, em prévia. Também GPT-OSS 120B para textos elaborados e GPT-OSS 20B para rascunhos rápidos. |
| **Nous Portal**  | `NOUS_API_KEY`                                         | ⭐ **DeepSeek V4 Flash**: o mais completo (opinião e imitar estilo). Também LongCat 2.0, Qwen 3.7 Flash, Mistral Nemo, Llama 3.1 8B…            |
| **NVIDIA NIM**   | `NVIDIA_API_KEY`                                       | Nemotron 3 Super 120B: rebater afirmações e textos formais.                                                                                     |
| **Mistral**      | `MISTRAL_API_KEY`                                      | Ministral 14B/8B/3B: PT-BR natural e rápido.                                                                                                    |
| **AnyAPI**       | `ANYAPI_API_KEY`                                       | Dots 3 Note e Nemotron 3 Nano Omni (free).                                                                                                      |
| **OrcaRouter**   | `ORCAROUTER_API_KEY`                                   | DeepSeek V4 Flash, GLM 5.3 Flash e Hunyuan 3 (free).                                                                                            |
| **OpenRouter**   | `OPENROUTER_API_KEY`                                   | Nemotron 3 Super (free), `openrouter/free` como reserva automática, Nex, Dots, LFM…                                                             |
| **Together AI**  | `TOGETHER_API_KEY`                                     | Llama 3.3 70B Turbo Free; DeepSeek R1 Distill 70B Free (lento).                                                                                 |
| **Cloudflare**   | `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`       | Workers AI (10 mil neurons/dia): Llama 3.3 70B Fast, Mistral Small 3.1, Llama 4 Scout, Gemma 3.                                                 |
| **Cohere**       | `COHERE_API_KEY`                                       | Command A (ótimo para rebater e formal) e Command R7B. Chave de teste grátis.                                                                   |
| **Hugging Face** | `HUGGINGFACE_API_KEY`                                  | Créditos mensais: Qwen 3 235B, DeepSeek V3, Llama 3.3 70B, Gemma 3 27B.                                                                         |
| **ModelScope**   | `MODELSCOPE_API_KEY`                                   | Chamadas grátis por dia: Qwen 3 235B, DeepSeek V3.1, Kimi K2, Qwen 3 32B.                                                                       |
| **AIHubMix**     | `AIHUBMIX_API_KEY`                                     | Modelos -free (Gemini 2.0 Flash, GPT-4.1). Ids mudam: ajuste com `AIHUBMIX_MODELS`.                                                             |
| **Meu modelo**   | `CUSTOM_API_KEY` + `CUSTOM_BASE_URL` + `CUSTOM_MODELS` | Seu fine-tune (Ollama/HF/Together). Vira o recomendado para persona.                                                                            |

Modelos de código (Codestral, Laguna, North Mini Code), de domínio (Ling Saúde/Finanças) e o ALLaM (árabe) ficam na lista, mas com nota baixa: não servem bem para conversa em PT-BR.

**Resumo da recomendação**

- Resposta curta de WhatsApp → **Groq · Qwen 3.8 27B** (alternativa: Mistral · Ministral 14B)
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
- A política de permissões libera o microfone para o próprio app, usado somente no ensaio de fala. A gravação fica na memória do navegador; ao pedir transcrição, o áudio é enviado ao Groq.
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
- `tests/`: testes unitários do humanizador, WhatsApp, datasets, validação, rate limit, prompts, provedores, estado e das cinco ferramentas de Fora da bolha.

O estado do navegador usa uma versão de schema e migrate automaticamente configurações antigas. O histórico recente de respostas também fica no `localStorage`, sem sair do dispositivo.

## Privacidade

- Em **Meu estilo → Backup do Persona** você exporta (e restaura) um JSON com perfil, exemplos, configurações, histórico, diário, acordos, pendências e lembretes, com opção de versão anonimizada por trocas “real = apelido”.
- Perfil, exemplos, configurações, histórico, diário e acordos de expressões ficam no `localStorage` do navegador; o rascunho de ordem de serviço, a senha do app e os textos de Fora da bolha (pouca energia, passagem de bastão, sem contexto e cartão de bolso) ficam apenas em `sessionStorage`.
- O servidor repassa o pedido ao provedor escolhido, então exemplos e contexto deixam o navegador durante a geração. Evite dados sensíveis.
- As chaves de API e URLs privadas dos provedores não são enviadas ao frontend.
- Evite importar conversas com dados sensíveis de terceiros e use a limpeza/anonimização antes de fazer fine-tuning.

### Atualização dos catálogos (novembro de 2026)

- Cohere: Command A+, Command A Reasoning, Command A e Aya Expanse 32B; o R7B existente permanece.
- Groq: GPT-OSS 120B, Qwen 3.8 27B (prévia) e GPT-OSS 20B. Qwen 3.6 e Compound foram retirados do catálogo padrão.
- OpenRouter: Gemma 4 31B, Gemma 4 26B A4B, Nemotron 3.5 Super VL e Dots 3 Note Preview foram adicionados/atualizados; Span-01 Lite aparece separado para decisões. A disponibilidade de modelos gratuitos depende do provedor.

Referências: [Cohere](https://docs.cohere.com/docs/models), [Aya](https://docs.cohere.com/docs/aya-expanse), [Groq](https://console.groq.com/docs/models), [OpenRouter](https://openrouter.ai/api/v1/models), [Span-01 Lite](https://openrouter.ai/respan/span-01-lite:free).

### Regressões de interface

Com o app rodando, `scripts/check-decision-ui.cjs` verifica que trocar o rascunho ou os compromissos invalida análises anteriores. É uma verificação opcional com Playwright instalado no ambiente de desenvolvimento; use `PERSONA_TEST_URL` para o endereço do app e `CHROME_PATH` apenas se usar um Chrome já instalado. Respostas externas são simuladas; o componente real é exercitado. A suíte Node principal continua sem essa dependência.
