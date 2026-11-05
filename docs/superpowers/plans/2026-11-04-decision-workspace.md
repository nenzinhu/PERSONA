# Decision workspace implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task with TDD and one final independent code review.

**Goal:** Deliver all five approved communication tools, preserving the six existing areas.

**Architecture:** A new Decidir e responder area owns session-only source/draft/alias data and browser-local, explicitly confirmed commitments. A shared authenticated/rate-limited generation route returns validated structured responses. Pure modules own reversible text replacement, request/output validation, and commitment lifecycle.

**Tech Stack:** Existing Next.js, React, TypeScript, Zod, Node tests. No new runtime dependency.

**Spec:** The five ideas approved in this conversation: explicit intent/limits; source-grounded draft review; confirmed pending items/commitments; conflicts between sources; locally reviewed aliases before provider transmission.

## Global constraints

- Suggestions never send messages or execute orders.
- AI statements are proposals; displayed evidence must occur verbatim in supplied sources.
- Commitments require user confirmation and a named subject; retain conditions and dates verbatim.
- Alias mappings remain in the browser session and are excluded from the API payload. A review step shows all text sent to the provider. This initial protection applies to the new decision area, explicitly labeled; legacy audio/print flows are outside it.
- No-response intent disables generation without preventing analysis.
- Preserve existing storage keys, provider/password/rate-limit behavior, light/dark and mobile support.

## Review focus

- Overlapping aliases and text that already contains an alias must not corrupt restoration.
- Editing inputs while a request is running must discard stale output and cancel requests.
- No cross-subject commitments in AI context.
- Hallucinated evidence and malformed model JSON must not appear as verified findings.
- Drafts must remain editable and no-result/error states must explain recovery.

## Tasks

- [x] 1. Test local alias replacement/restoration and confirmed commitment lifecycle, observe failures, implement pure helpers.
- [x] 2. Test request schemas, prompt boundaries, no-response intent and grounded structured output; observe failures; implement decision module and protected route.
- [x] 3. Implement new workspace and review-before-send flow using those helpers; integrate navigation without replacing existing areas.
- [x] 4. Reproduce dark badge contrast failure with rendered CSS, correct foreground pairing, verify both dark modes.
- [x] 5. Run full suite, lint, typecheck, production build, browser flows with controlled provider responses; review mobile/desktop and obtain independent code review.
- [ ] 6. Resolve material findings, update docs, push main and verify production deployment.

## Added scope during execution

- User requested Cohere four-model update, Groq three text models, OpenRouter four selected text models plus Span-01 Lite via separate Decisions integration, and PWA installation.
- Final review found and reproduced three state regressions; fixed stale draft/memory evaluations and completed-record edit status.
- 106 Node tests plus browser regression/end-to-end flows pass before release.
