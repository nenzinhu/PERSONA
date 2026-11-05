---
name: Persona
description: A calm communication desk for writing in your own voice.
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
  rail: "#edf2f8"
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
  dark-rail: "#172230"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "31px"
    fontWeight: 400
    lineHeight: 1.15
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

# Design System: Persona

## Overview

**Creative North Star: "The Communication Desk"**

Persona is a communication desk: a quiet slate-blue tool rail supports a practical writing workspace. White working surfaces and a clear input/result pairing keep the received message and response at the center.

Geist carries the everyday interface. Instrument Serif creates a softer expressive pause in the response empty state; existing coaching tips and some secondary empty states also retain serif text. The dark alternative uses navy surfaces and a lighter blue accent with the same spatial system.

**Key Characteristics:**

- Quiet slate-blue navigation and neutral working surfaces.
- Practical sans-serif controls with restrained expressive serif moments.
- Paired desktop work areas that become one column on smaller screens.

## Colors

The palette uses quiet blue accents against cool neutral surfaces, with separate semantic feedback colors.

### Primary

- **Communication Blue** (accent): generation actions, selected navigation text, icons, keyboard focus and text carets. Accent-hover strengthens primary hover; accent-soft supports analysis and selected choices. On-accent supplies action text.

### Neutral

- **Cool Workspace** (bg), **Working White** (card) and **Slate Rail** (rail) separate page, working surface and tools.
- **Navy Ink** (ink), **Secondary Ink** (ink-2) and **Muted Slate** (muted) establish text hierarchy.
- Line defines controls; edge defines quieter dividers; track supports inactive controls and sliders; them distinguishes incoming conversation text.
- Marker and marker-ink remain the shared highlight pair; their values do not change in dark mode.
- Ok, neg / neg-soft and warn / warn-soft carry success, error and intermediate-score feedback.
- Frontmatter dark-* entries record the explicit dark overrides of matching runtime properties. System mode uses the same overrides through the operating-system preference.

**The Semantic Surface Rule.** Use the canonical runtime properties so foregrounds and backgrounds change together across themes.

## Typography

**Display Font:** Instrument Serif with Georgia fallback.  
**Body Font:** Geist with system sans-serif fallback.  
**Label/Mono Font:** Geist for ordinary labels; Geist Mono remains in code, fader values and some technical/coaching metadata.

The pairing is practical and calm. The serif is an expressive accent; working text remains easy to scan and edit.

### Hierarchy

- **Display:** response empty-state heading; mobile reduces it to 29px. Existing coaching tips and some secondary empty-state paragraphs retain italic serif styling.
- **Headline:** balanced page title; mobile sets its size to 26px.
- **Title:** compact panel headings.
- **Body:** everyday interface. Main message entry uses 15px/1.7 Geist; empty-state explanatory text uses 13px/1.8 with a 34ch measure.
- **Label:** field labels and disclosure summaries. Navigation uses 13px/1.4 at weight 500; secondary actions use 0.86rem.

**The Working Type Rule.** Keep message entry, navigation and routine controls in the sans-serif family.

## Layout

Desktop uses a sticky viewport-height 248px tool rail and flexible workspace. The main shell has a 1480px maximum width, 42px horizontal padding and an 84px header. Input and results use a 1.1fr / 1fr split with a 26px gap. The input composer owns a surface; results stay open until content exists. Other tools reuse this grid or a 1.4fr / 1fr guide grid.

At 1180px and below, the rail becomes 216px, shell padding becomes 26px and paired gap/composer padding become 20px. At 980px and below, grids and guides become one column. At 720px and below, the rail becomes a top header with horizontally scrolling navigation; supplementary rail content disappears, the shell gets 18px side padding, secondary actions have 44px touch targets, and fields use 16px text. At 1600px and above, shell horizontal padding grows to 60px.

## Elevation & Depth

The workspace is flat: tonal separation, one-pixel borders and spacing establish depth. There are no decorative shadows. A chosen response uses a functional one-pixel ink ring (0 0 0 1px var(--ink)). Keyboard focus uses a two-pixel accent outline with offset rather than elevation.

## Shapes

Working surfaces have gently curved corners. The frontmatter records common radii. Chat bubbles retain asymmetric corners to distinguish incoming and outgoing turns. Compact feedback tags retain 4px corners; the expressive empty-state symbol has 22px corners.

## Components

### Buttons

Primary generation actions have blue fill, contrasting text, a 48px minimum height and stronger hover fill. Disabled primary actions use track and muted colors at full opacity. Secondary actions use line borders; ghost actions remove the border and underline on hover. Mobile secondary actions have a 44px minimum height. Preserve the shared keyboard outline.

### Chips

Personality chips have compact rectangular corners and a 34px minimum height. Positive selection uses the marker pair; negative selection uses the negative soft surface and negative border. Segmented choices use outlined buttons, with accent border/text and soft accent fill when selected. Selected choices expose pressed state.

### Cards / Containers

The composer is a bordered working surface. Guide/result cards use the shared surface radius and 22px padding; response cards use the response radius and 18px padding. Analysis and coaching summaries use soft blue surfaces with 10px corners. Rings communicate response selection.

### Inputs / Fields

Regular fields use line borders, card backgrounds and compact corners. The main message area has 16px padding, a 158px minimum height and workspace-colored fill. Hover strengthens the border; focus adds an accent outline. Error notices use negative soft surfaces and negative text. Textareas resize vertically.

### Navigation

The slate rail has icon-and-label buttons. Active navigation has card fill, accent text and aria-current; hover uses edge fill. Mobile navigation scrolls horizontally with 44px minimum targets. The theme switch uses a compact track with a card-colored selected segment and pressed state.

### Response Workspace

The response empty state uses a soft blue symbol block and serif heading. Generated responses are editable outgoing bubbles with metadata and wrapping actions. Loading uses soft blue status surfaces and a breathing dot. Reduced-motion preference disables animations and transitions.

### Decision workspace and installation

Decidir e responder inherits the slate rail and paired workspace. The left writing surface holds sources and intent; the right side holds draft, send preview and evidence. At 1180px and below the decision pair becomes one column. A full-width ledger holds only confirmed records for the named subject. Evidence quotes use the existing line/card tokens; lifecycle status combines text and color. Preview content is pre-wrapped and scrollable without horizontal overflow. No new color tokens are introduced.

The install action is a compact secondary button in the rail, and at the top right of the mobile header. Fallback installation instructions expand in an accessible inline region. The IA tags and profile initials retain the marker/marker-ink pairing in both themes (readable dark-mode foreground).

## Do's and Don'ts

### Do:

- **Do** use runtime semantic variables for theme-aware surfaces and state colors.
- **Do** keep labels and controls in Geist and preserve visible keyboard focus.
- **Do** let navigation scroll horizontally on mobile and stack input before results.

### Don't:

- **Don't** introduce decorative shadows into the flat workspace.
- **Don't** use display serif for the main message input or navigation.
- **Don't** use color alone to communicate selected navigation or disabled actions.

<!-- Ownership Model B: app/globals.css is canonical for runtime tokens and responsive behavior. DESIGN.md and .impeccable/design.json are descriptive snapshots; update them after CSS changes. Neither file generates or overrides runtime styles. -->
