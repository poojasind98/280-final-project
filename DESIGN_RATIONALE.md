# ErrSense — Design Rationale

A one-page reference for the UI/UX decisions behind ErrSense, an AI-enhanced
error monitoring dashboard. Use this as both a submission artifact and a
speaker's reference during the final-project presentation.

---

## 1. The user and the problem

**User:** an on-call software engineer triaging production errors at 2 a.m.
**Problem:** raw stack traces are dense, noisy, and slow to parse. Triage
takes too long; duplicate errors slip through; severity is hard to scan.
**Goal:** a dashboard that turns stack traces into actionable insight in
seconds, with AI as a co-pilot — not a black box.

This framing drove every design decision below: optimize for **fast scanning
under stress**, **legibility on dark surfaces** (most engineers run dark
themes), and **explainable AI** (every model output cites its grounding).

## 2. Design principles

| Principle                                 | What it means here                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Calm, not loud**                        | Dark base + subtle aurora; high contrast saved for what matters (errors, AI surfaces).                   |
| **Layered, not flat**                     | Glassmorphism replaces drop shadows. Depth communicates hierarchy on dark.                               |
| **AI is visible, never hidden**           | Conic-gradient borders, sparkle marks, and citations make AI surfaces unmistakable.                      |
| **Information density without overwhelm** | Mono fonts, tabular numerals, and tight tracking pack information; whitespace and gradients separate it. |
| **Accessible by construction**            | A11y is not "added later" — every interactive surface, animation, and color was checked.                 |

## 3. Visual system

### 3.1 Color (token-based, exposed as CSS variables in `styles/global.scss`)

| Role             | Token              | Value                   | Why this color                                                           |
| ---------------- | ------------------ | ----------------------- | ------------------------------------------------------------------------ |
| Base             | `--bg-base`        | `#060914`               | Cosmic navy — warmer than pure black, less harsh on long sessions.       |
| Glass surface    | `--glass-bg`       | `rgb(255 255 255 / 4%)` | Lifts content off the aurora without competing with accents.             |
| Primary text     | `--text-primary`   | `#F5F7FA`               | Off-white. Pure white at 16px on dark backgrounds is fatiguing.          |
| AI accent        | `--accent-strong`  | `#8B5CF6` (violet)      | Reserved for AI surfaces only — instantly readable as "this is AI".      |
| AI accent (cool) | `--accent-cyan`    | `#22D3EE`               | Pairs with violet for the conic gradient; signals retrieval / citations. |
| Error            | `--status-error`   | `#FB7185` (rose)        | Tuned for **AAA contrast on `#060914`** (≥ 7.5:1).                       |
| Warning          | `--status-warning` | `#FBBF24`               | Amber, not yellow — distinguishable from cyan accents.                   |
| Success          | `--status-success` | `#34D399`               | Mint — never confuses with cyan.                                         |

**Triadic accent family** (violet → cyan → magenta): used as a gradient on AI
surfaces only. This makes the AI's "personality" visually consistent across
the app without ever applying it to non-AI elements.

### 3.2 Typography (mixed sans + mono)

- **`Inter`** (loaded via `@fontsource`) for display, headings, and body.
  Picked for excellent legibility at small sizes and tight tracking at large.
- **System monospace** (`ui-monospace, "SF Mono"`) for IDs, error names,
  stack traces, citation IDs, filter chips, and code.

The semantic register is enforced everywhere:

| Mono is used for                         | Why                                     |
| ---------------------------------------- | --------------------------------------- |
| Issue IDs and citation refs (`[#a1b2]`)  | Signals "machine identifier"            |
| Stack traces and code blocks             | Reads as developer artefact             |
| Filter chips, status badges (small caps) | Distinguishes meta UI from content      |
| Numbers in tables (`tnum`)               | Tabular numerals align under each other |

### 3.3 Layout — depth via glass, not gravity

- Surfaces use `backdrop-filter: blur(24px) saturate(160%)` over translucent
  white (`rgb(255 255 255 / 4%)`).
- Each surface is wrapped in `isolation: isolate` so glow effects don't
  bleed across cards.
- Borders are 1px low-opacity white (`rgb(255 255 255 / 14%)`) instead of
  drop shadows — drop shadows on dark themes look muddy.

### 3.4 Motion — restrained, purposeful, opt-out-able

| Animation           | Where                  | Budget                      |
| ------------------- | ---------------------- | --------------------------- |
| Aurora drift        | Body background        | 28s, ease-in-out, alternate |
| Conic gradient ring | AI Triage Panel border | 8s linear, infinite         |
| Streaming cursor    | AI output              | 1s steps                    |
| Card hover lift     | Project & issue cards  | 220ms cubic-bezier          |
| Drawer slide-in     | Copilot Drawer         | 280ms cubic-bezier          |
| Skeleton shimmer    | Loading state          | 1.6s linear                 |

Every animation respects `@media (prefers-reduced-motion: reduce)` and
disables itself for users who request it. **Talking point:** motion is
ambient (always-on, peripheral) for the aurora and the AI ring; reactive
(triggered by user input) for hovers and drawers. The two never compete.

## 4. Component-level decisions worth discussing

### Project Card (`features/projects/.../project-card.module.scss`)

- The gradient ring around the card uses **a CSS mask trick** (two stacked
  `linear-gradient(#000 0 0)` masks composited with `xor`) to clip a 1px
  border out of a full gradient layer. This is the cleanest way to do a
  gradient outline without an extra wrapper element.
- Hover state: `translateY(-2px)` + the mask reveals at 55% opacity. Reads
  as "the card is reaching toward you".

### AI Triage Panel (`features/ai/components/triage-panel/`)

- Conic-gradient ring rotates `8s linear infinite`. **This is the strongest
  visual statement in the app** — it's the only animated border, and it's
  reserved for the AI's primary surface.
- Inner glow pinned to the top-left via a fixed-position pseudo-element
  with a radial-gradient. Subtle, never overwhelming.
- Citations are rendered as inline cards at the bottom of the panel —
  similarity scores in cyan mono, names in mono semibold. **Visible
  grounding is non-negotiable for AI UX.**

### Copilot Drawer (`features/ai/components/copilot-drawer/`)

- Glass surface (`rgb(20 26 46 / 78%)`) over a backdrop-blurred overlay,
  with a soft purple glow at the top edge.
- User messages: violet gradient bubble with bottom-right tail.
  Assistant: glass bubble with bottom-left tail. Standard chat affordance.
- Send button uses the violet → cyan gradient with a soft drop shadow that
  _intensifies_ on hover. Communicates AI-ness without being a logo.
- Suggestion chips have a `›` mono prefix in violet. On hover they slide
  `2px` to the right.

### NL Filter Bar (`features/ai/components/nl-filter-bar/`)

- The form field has a focus state that **pulses** (`box-shadow` ring + glow).
- **Editable parsed filters** as removable chips with a transparency
  rationale. The user always sees what the AI inferred and can correct it.
  No silent state mutation.

### Issue Row (`features/issues/.../issue-row.module.scss`)

- Error name uses gradient text from `--status-error` to `--accent`.
  Subtle, but instantly draws the eye to the failing call site.
- Stack-trace preview is mono, single-line, ellipsis-truncated. Density
  without noise.

### Status Badge (`features/ui/badge/`)

- Tiny `box-shadow: 0 0 8px currentcolor` glowing dot pseudo-element on
  every badge. **Redundant encoding for color-blind users** — severity is
  signalled by color _and_ by the dot's presence and color, not just hue.

## 5. Accessibility — the non-negotiable list

- Color contrast checked against WCAG AA (≥ 4.5:1 for body, ≥ 3:1 for
  large text). The rose error tone exceeds AAA on the dark base.
- All interactive elements have visible `:focus-visible` rings.
- The Copilot Drawer is a real `role="dialog" aria-modal="true"`:
  - Traps `Tab` and `Shift+Tab`.
  - Closes on `Escape`.
  - Restores focus to the trigger on close.
- Streaming AI output is wrapped in `aria-live="polite"` + `aria-busy`.
  Screen readers announce updates without spam.
- Every animation has a `prefers-reduced-motion: reduce` fallback.
- Status badges use **two channels** (color + glowing dot).
- The AI filter bar's parsed result is rendered as editable, labelled
  chips — never a silent UI mutation.

## 6. Tradeoffs and explicit non-goals

- **No light mode (yet).** Out of scope, but the system is built on CSS
  custom properties so a `[data-theme="light"]` override is mechanically
  straightforward.
- **No 3D / parallax / scroll-jacking.** These read well in screenshots
  and badly in actual use. Calm > spectacle.
- **No icon library / illustration set.** Custom mark + system glyphs
  (`✦`, `›`, `→`) keep bundle size small and avoid the "every dashboard
  looks the same" problem.
- **No animated charts.** A monitoring tool's charts must be glanceable
  first; animation is reserved for stateful transitions, not data.

## 7. How to evaluate this work

Concrete metrics you can capture for the presentation:

| Metric                         | How to capture                                          | Target                                |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------- |
| Lighthouse Performance         | `npx lighthouse http://localhost:3000/dashboard/issues` | ≥ 90                                  |
| Lighthouse Accessibility       | same                                                    | ≥ 95                                  |
| axe-core violations            | DevTools or `@axe-core/cli` on the Copilot drawer       | 0 critical                            |
| Color contrast                 | Lighthouse → "Contrast" audits                          | All pass                              |
| Reduced-motion compliance      | DevTools → Rendering → emulate `prefers-reduced-motion` | All animations stop                   |
| AI feature time-to-first-token | Network tab on `/api/ai/triage`                         | < 1.5s with live key                  |
| Bundle size                    | `next build` output                                     | First Load JS < 150 kB on detail page |

## 8. Five-bullet "elevator pitch" for the presentation

1. **A dark, glassmorphic monitoring dashboard with an AI Copilot, designed
   for the real conditions on-call engineers actually work in.**
2. **Three AI features** that each map to a different AI-UX pattern:
   RAG (triage), conversational (drawer), structured-output (NL filter).
3. **AI is visible, not hidden** — gradient rings, sparkle marks, and
   inline citations make AI surfaces unmistakable.
4. **A token-based design system** with CSS custom properties for color,
   type, motion, and radii, so the system is editable in one place.
5. **Accessibility built in, not bolted on**: focus traps, aria-live
   regions, color-blind-safe status, motion opt-out, AAA contrast on
   error states.
