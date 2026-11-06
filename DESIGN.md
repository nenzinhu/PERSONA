---
name: Persona
description: Uma mesa de escrita com navegação compacta e foco na conversa.
colors:
  bg: "#f5f7fa"
  card: "#ffffff"
  ink: "#243247"
  ink-2: "#46566c"
  muted: "#617087"
  line: "#d6dee8"
  edge: "#e4e9f0"
  track: "#e9eef4"
  marker: "#dce9fb"
  marker-ink: "#243247"
  them: "#eef3f9"
  ok: "#2f6f3a"
  neg: "#b0412a"
  neg-soft: "#fbece7"
  warn: "#8a6212"
  warn-soft: "#fbf4e2"
  accent: "#245a9b"
  accent-hover: "#1b467b"
  accent-soft: "#e9f0fa"
  on-accent: "#ffffff"
  dark-bg: "#141c28"
  dark-card: "#1c2736"
  dark-ink: "#eef3f9"
  dark-ink-2: "#cad5e4"
  dark-muted: "#a7b5c8"
  dark-line: "#39475a"
  dark-edge: "#2e3c4e"
  dark-track: "#243244"
  dark-them: "#243244"
  dark-ok: "#9ad28f"
  dark-neg: "#e58a70"
  dark-neg-soft: "#3a2420"
  dark-warn: "#dcaa4a"
  dark-warn-soft: "#362d1c"
  dark-accent: "#a6caff"
  dark-accent-hover: "#c1d9fc"
  dark-accent-soft: "#243c59"
  dark-on-accent: "#152337"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(42px, 6vw, 72px)"
    fontWeight: 400
    lineHeight: 0.98
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

A identidade combina papel claro, fundo escuro de tinta e violeta para ações e seleção. Instrument Serif identifica a área aberta. Geist fica nos textos, campos e controles. O símbolo de conversa em violeta aparece no cabeçalho, no favicon, no atalho do iOS e nos ícones de instalação. A versão para máscara mantém a figura na região central.

## Layout

O cabeçalho agrupa Decidir, Conversa e Na prática. Mais dá acesso a perguntas, afirmações, treino, perfil, modelos e tema. Em telas de até 720 px, a marca e a instalação ficam acima dos quatro controles de navegação. O conteúdo central tem largura máxima de 1360 px, com dois painéis quando há espaço. A área Decidir empilha os painéis até 940 px. Os demais fluxos usam seus limites existentes.

## Comportamento

- Comece pelo texto a analisar. Em Decidir, a mensagem recebida vem antes do assunto.
- Reutilize campos, botões e estados da folha global. A navegação expõe a área atual, e o menu Mais fecha com Escape.
- Preserve foco visível, zoom e alvos de toque de pelo menos 44 px nos controles da navegação.
- Use os tokens semânticos de fundo e texto nos dois temas. Reservar sombra para painéis flutuantes reduz a competição com o editor.
- O tema pode seguir o sistema ou ser escolhido em Mais → Aparência.

<!-- app/globals.css é a fonte de verdade dos tokens e do layout. -->
