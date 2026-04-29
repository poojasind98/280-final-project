# AI Usage Documentation

This file documents how AI tools were used while building **ErrSense**, and
what design / engineering decisions were made independently. Required by the
course's instructor notes.

## AI tools used

- **Cursor** (with Anthropic Claude) — used as the primary coding assistant
  for scaffolding components, generating SCSS, and exploring code.
- **OpenAI Chat Completions API** (optional, runtime) — powers the live AI
  features in the deployed app. Calls go through a server-side abstraction
  (`features/ai-server/ai-provider.ts`) so the API key is never exposed to the
  browser. When no key is configured, the app transparently falls back to a
  deterministic local mock provider, so reviewers can run every AI flow with
  zero cost.

## What the AI generated

The following pieces were generated or substantially co-written with Cursor:

- Boilerplate SCSS for new components (skeleton states, drawer animations,
  chip styling).
- Initial draft of the streaming SSE reader (`features/ai/api/sse-client.ts`)
  and the matching server-side helper (`features/ai-server/sse.ts`).
- The minimal markdown-with-code-fences renderer
  (`features/ai/components/streamed-markdown/`).
- Mock-provider sample text for the no-API-key fallback.
- First-pass React hooks (`useTriage`, `useChat`, `useNLFilter`) — refined by
  hand for cancellation correctness and focus management.

## What was decided independently

These choices were made by the developer, not the AI, and reflect the
project's product and engineering judgement:

- **Product framing** — a *Copilot for production-error triage* solving a
  concrete user problem (on-call engineers spending too long parsing stack
  traces and identifying duplicates). This was selected over a generic chatbot
  precisely because it surfaces grounded, citable context.
- **Three-feature scope** — RAG triage panel, conversational drawer, NL
  filter bar. Each maps to a different AI-UX pattern called out in the
  project rubric.
- **Provider abstraction with a mock fallback** — every AI feature must be
  fully demonstrable without an API key, so the app remains gradable and
  demo-able with zero spend. This is implemented in `ai-provider.ts`.
- **RAG approach: TF-IDF cosine similarity** rather than embeddings. For
  short error strings (`name`, `message`, top stack frame), shared identifier
  tokens carry most of the signal; this keeps the system fully deterministic,
  has no external dependency, and is fast enough to compute per-request. The
  scoring function (`features/ai-server/similarity.ts`) was hand-tuned
  (stopwords, IDF smoothing, `topK` cutoff).
- **Citations as a first-class UI element** — the triage panel always renders
  *which* past issues were used as context, with their similarity scores.
  This is the "thoughtful integration" the rubric asks for: the model's
  grounding is visible to the user, who can verify it.
- **Editable parsed filters** — the NL filter bar shows the parsed filter as
  removable chips and a transparency rationale. The AI never silently mutates
  app state; the user always sees and can correct what was inferred.
- **Streaming with stop / regenerate** — both the triage panel and chat
  support cancellation via `AbortController` end-to-end. This reflects real
  production AI-UX patterns and gives the user control.
- **Accessibility decisions**:
  - The Copilot drawer is a true ARIA dialog (`role="dialog"`, `aria-modal`),
    traps focus while open, restores focus to the previously focused element
    on close, and closes on `Escape`.
  - Streamed regions use `aria-live="polite"` + `aria-busy` so screen readers
    announce updates without spamming.
  - All animations honour `prefers-reduced-motion`.
  - Visible focus rings on every interactive element.
- **Privacy & ethics**:
  - The OpenAI key is server-side only (`OPENAI_API_KEY`, no `NEXT_PUBLIC_`
    prefix).
  - The mock-provider banner and the citations make it obvious to users when
    AI is being used and what context is being sent.
  - History is bounded (`MAX_HISTORY = 16`) and per-message size is clamped
    (`MAX_CONTENT = 4000`) before being sent upstream, which keeps prompt
    cost and PII surface area predictable.

## Verification

For each AI-generated chunk:

- Code was read end-to-end before being committed.
- Type-checking and linting pass (`npm run check:types`, `npm run lint:code`).
- Behaviours that the AI got wrong on the first pass and were corrected by
  hand:
  - The first SSE reader assumed `\n` as the frame separator; the SSE spec
    requires `\n\n`. This caused frames to be parsed mid-message and was
    fixed.
  - The original chat hook lost the in-flight assistant text on `stop`. The
    fix promotes any partial response into the message history so the user
    keeps the truncated answer.
  - The first triage prompt asked for markdown headers; this rendered
    awkwardly mid-stream, so the prompt was rewritten to produce labelled
    prose paragraphs that look correct even when half-streamed.

## How to evaluate this work

- Run with no `OPENAI_API_KEY` to exercise the full UI against the mock
  provider — every feature is demonstrable.
- Add a key to `.env` to see live model output.
- Suggested evaluation set:
  - Lighthouse pre/post on `/dashboard/issues` and the new
    `/dashboard/issues/[issueId]` route.
  - axe-core scan of the Copilot drawer (focus trap, ARIA roles).
  - Time-to-first-token on `/api/ai/triage` (target: < 1.5s with a live key).
  - Token usage per triage request (logged server-side; can be added).
