# Persona

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personal use by the owner in Brazilian Portuguese, for professional military communication and personal conversations, including former partners.

## Product Purpose

Analyze incoming messages, generate responses that reflect the owner's writing style and selected personality traits, and support spoken practice, reflection, and preparation for in-person communication.

## Operating Context

Paste a question, statement, or conversation; optionally analyze intention and emotion; generate, adjust, copy, and save a response. Practice conversations, rehearse a spoken explanation, reflect on real conversations, prepare WhatsApp updates for service-order execution, and teach the app using real examples.

## Capabilities and Constraints

Existing Next.js app with nine views: Decidir e responder, Pergunta, Afirmação, Conversa, Treino, Comunicação na prática, Meu estilo, Modelos and Fora da bolha. The practical communication view groups oral rehearsal, a manual post-conversation journal, manual service-order status updates with required photo attachment for WhatsApp sharing, and a P-115/P-18 patrol text builder (operation, vehicle number, km and a highway, access or bridge from a fixed Florianópolis list; bridges carry no km; no date or time). No order, regulation, rank, or completion status is inferred; the user supplies and confirms the report. Audio and image data are temporary. The Fora da bolha view groups five tools that never call an AI: low-energy availability messages, a reviewed hand-off card built from pasted conversation lines, a context-free reading of the draft, a browser-local dictionary of agreed meanings for ambiguous expressions, and a printable pocket card (say/ask/limit). Texts stay in the browser session; agreed meanings stay in localStorage. No meaning, feeling, priority, or classification is inferred. Preserve provider integration, local profile/history, theme preference, audio, screenshot import, simulation, and export. The decision area adds explicit intent/limits, grounded draft review, user-confirmed pending records scoped by subject with optional due dates and local reminders, source conflict comparison, and reviewed local alias substitution. A local JSON backup (with an anonymized option) exports and restores everything kept in the browser. A saved-response library with tags, personal copy-time corrections, a browser dictation button, an A/B comparison of two generated versions with the style score, a review pause before copying texts with distortion markers, a conversation rhythm panel measured only from pasted timestamps, a local service-order history to continue the next phase, and a training journal with per-situation averages and trend. Aliases apply only to this area. An optional Span-01 Lite evaluator uses the OpenRouter Decisions API. Installation is available as a PWA; AI requires a network connection.

## Brand Commitments

Keep the name Persona and Brazilian Portuguese. User delegated visual decisions and requested direct implementation without previews.

## Product Principles

Make the received message and response the main workspace. Keep advanced settings available without competing with the main task. Preserve saved data and existing behavior.
