# ErrSense

ErrSense is an AI-enhanced error monitoring dashboard. It helps on-call
engineers triage production errors faster by combining a traditional issue
list with three AI features that turn raw stack traces into actionable
insight.

## What it does

1. **AI Triage Panel (RAG)** — On every issue detail page, ErrSense streams an
   auto-generated summary, likely root cause, and a copy-pasteable suggested
   fix. The model is grounded in the stack trace plus the most-similar past
   issues in the corpus, retrieved by an in-process TF-IDF cosine similarity
   search. Citations and similarity scores are surfaced in the UI so users can
   verify exactly what context the model used.
2. **Conversational Copilot Drawer** — A side-drawer chat scoped to the
   current issue. Issue context is auto-attached server-side, so users can ask
   things like *"write a test that reproduces this"*, *"draft a Slack update"*,
   or *"explain frame 3"* without manually re-explaining the bug. Streaming
   responses, stop / regenerate, suggestion chips, full keyboard support,
   focus trap, and ARIA dialog semantics.
3. **Natural-language filter bar** — Type *"react errors with more than 100
   events"* into the search and the issue list filters itself. The AI's parse
   is rendered as editable, removable chips with a transparency rationale —
   the AI never silently mutates app state.

See [`AI_USAGE.md`](./AI_USAGE.md) for the full breakdown of how AI tools were
used during development and what decisions were made independently.

## Tech stack

- **Next.js 13** with the Pages Router, **TypeScript**, **SCSS modules**
- **React Query** for data fetching and caching
- **OpenAI Chat Completions API** (server-side, optional) with a built-in
  deterministic mock fallback so the app remains fully demonstrable without
  an API key
- **Cypress** for end-to-end tests, **Storybook** for component documentation,
  **Jest** for unit tests
- **ESLint**, **Stylelint**, **Prettier**, and a Husky pre-commit hook

## Getting Started

### 1. Clone & Install

```bash
npm install
```

### 2. Create .env File

Copy the `.env.template` file to a new file called `.env`. The base API URL
is required.

The AI features have an optional `OPENAI_API_KEY`. If you set it, the Copilot
calls a live model. If you don't, the app uses a deterministic mock provider
— every AI flow remains fully demonstrable, just with canned (clearly-labelled)
responses.

### 3. Run Development Server

```bash
npm run dev
```

Now you can open [http://localhost:3000](http://localhost:3000) and click the
"Dashboard" link to see the app.

## Recommended VS Code Extensions

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [SCSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=mrmlnc.vscode-scss)
- [React CSS modules](https://marketplace.visualstudio.com/items?itemName=viijay-kr.react-ts-css)

The official Stylelint extension might need some adjustment of your
`settings.json` file. If it doesn't work out of the box try adding these
lines:

```
"css.validate": false,
"less.validate": false,
"scss.validate": false,
"stylelint.validate": ["css", "scss"]
```

## Tests

End-to-end tests live in `cypress/`. Run them with:

```bash
npm run cypress
```

Unit tests run with:

```bash
npm test
```

## Storybook

Component documentation and visual tests:

```bash
npm run storybook
```
