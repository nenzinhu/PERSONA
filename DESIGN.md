---
name: Persona
description: Uma mesa de escrita com navegação compacta e foco na conversa.
colors:
  bg: "#f7f6f3"
  card: "#ffffff"
  ink: "#252139"
  ink-2: "#484257"
  muted: "#655e72"
  line: "#dcd7e2"
  edge: "#e8e4eb"
  track: "#efecf2"
  marker: "#e9e0ff"
  marker-ink: "#252139"
  them: "#f0ebfa"
  ok: "#2f6f3a"
  neg: "#b0412a"
  neg-soft: "#fbece7"
  warn: "#8a6212"
  warn-soft: "#fbf4e2"
  accent: "#5142a5"
  accent-hover: "#43338e"
  accent-soft: "#eee8fb"
  on-accent: "#ffffff"
  dark-bg: "#181622"
  dark-card: "#221f2e"
  dark-ink: "#f0ebfa"
  dark-ink-2: "#dad3e6"
  dark-muted: "#b8afc8"
  dark-line: "#474056"
  dark-edge: "#353041"
  dark-track: "#302a3e"
  dark-them: "#302a3e"
  dark-ok: "#9ad28f"
  dark-neg: "#e58a70"
  dark-neg-soft: "#3a2420"
  dark-warn: "#dcaa4a"
  dark-warn-soft: "#362d1c"
  dark-accent: "#c5b4ff"
  dark-accent-hover: "#ded2ff"
  dark-accent-soft: "#392f54"
  dark-on-accent: "#22183a"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(42px, 5vw, 64px)"
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(24px, 2.5vw, 32px)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: 1.55
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
rounded:
  surface: "14px"
  input: "8px"
  control: "7px"
  navigation: "9px"
  message-input: "10px"
  response: "12px"
spacing:
  control-gap: "8px"
  field-bottom: "20px"
  panel: "26px"
  workspace-gap: "26px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.input}"
    padding: "13px 22px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "7px 14px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "10px 12px"
  composer:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.surface}"
    padding: "26px"
  navigation-active:
    backgroundColor: "{colors.card}"
    textColor: "{colors.accent}"
    rounded: "{rounded.navigation}"
    padding: "13px 12px"
---

# Sistema visual do Persona

A identidade combina papel claro, fundo escuro de tinta e violeta para ações e seleção. Instrument Serif identifica a área aberta. As fontes Geist, Geist Mono e Instrument Serif são hospedadas em `public/fonts`, com licenças OFL, e carregadas por `next/font/local`; o build não depende do Google Fonts. Geist fica nos textos, campos e controles. O símbolo de conversa em violeta aparece no cabeçalho, no favicon, no atalho do iOS e nos ícones de instalação. A versão para máscara mantém a figura na região central.

## Layout

O cabeçalho agrupa Decidir, Conversa e Na prática. Mais dá acesso a perguntas, afirmações, treino, perfil, modelos e tema. Em telas de até 720 px, a marca e a instalação ficam acima dos quatro controles de navegação. O conteúdo central tem largura máxima de 1360 px, com dois painéis quando há espaço. A área Decidir apresenta uma sequência curta de leitura, limites e revisão; contexto e rascunho usam os mesmos painéis e se empilham até 940 px. O cabeçalho expõe o acesso a Modelos com o estado real de conexão da IA. Em telas de até 720 px, esse acesso fica abaixo do título. Os demais fluxos usam seus limites existentes.

## Comportamento

- Comece pelo texto a analisar. Em Decidir, a mensagem recebida vem antes do assunto.
- Reutilize campos, botões e estados da folha global. A navegação expõe a área atual, e o menu Mais fecha com Escape.
- Preserve foco visível, zoom e alvos de toque de pelo menos 44 px nos controles da navegação.
- Use os tokens semânticos de fundo e texto nos dois temas. Reservar sombra para painéis flutuantes reduz a competição com o editor.
- O tema pode seguir o sistema ou ser escolhido em Mais → Aparência.

<!-- app/globals.css é a fonte de verdade dos tokens e do layout. -->

## Controles canônicos

A folha global controla painéis, campos, foco e scrollbars. A navegação e o estado de conexão pertencem a `app/page.tsx`; cada área mantém seus formulários e sua validação existentes. Selects e a lista de assuntos preservam o comportamento nativo do navegador. Textareas preservam redimensionamento vertical manual para permitir revisão de textos longos. O título do documento acompanha a área aberta.
