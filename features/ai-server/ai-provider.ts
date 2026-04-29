import type { ChatMessage } from "../ai/lib/types";

export type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

export const isLiveProvider = () => Boolean(API_KEY);

/**
 * Stream a chat completion. Yields incremental text deltas. Falls back to a
 * deterministic mock generator when no API key is configured so the app remains
 * fully functional for development, demos, and grading without spend.
 */
export async function* streamChat(
  messages: ChatMessage[],
  opts: { temperature?: number; signal?: AbortSignal } = {},
): AsyncGenerator<StreamEvent> {
  if (!isLiveProvider()) {
    yield* mockStream(messages);
    return;
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts.temperature ?? 0.2,
      stream: true,
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    yield {
      type: "error",
      message: `Upstream model error (${res.status}): ${text.slice(0, 200)}`,
    };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || !line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") {
        yield { type: "done" };
        return;
      }
      try {
        const json = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield { type: "delta", text: delta };
      } catch {
        // ignore malformed keep-alive frames
      }
    }
  }
  yield { type: "done" };
}

/**
 * Non-streaming completion for endpoints that need the full response (e.g.
 * structured JSON output for the NL filter). Same mock fallback applies.
 */
export async function completeJson<T>(
  messages: ChatMessage[],
  fallback: T,
  opts: { signal?: AbortSignal } = {},
): Promise<T> {
  if (!isLiveProvider()) {
    return mockJson(messages, fallback);
  }
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0,
        response_format: { type: "json_object" },
      }),
      signal: opts.signal,
    });
    if (!res.ok) return fallback;
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return fallback;
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

// -------------------------------------------------------------------------
// Mock provider — deterministic, no network. Produces realistic-looking,
// helpful responses so the UI/UX is fully demonstrable without an API key.
// -------------------------------------------------------------------------

const ENC = new TextEncoder();
void ENC;

async function* mockStream(
  messages: ChatMessage[],
): AsyncGenerator<StreamEvent> {
  const system = messages.find((m) => m.role === "system")?.content || "";
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUser?.content || "";

  let body: string;
  if (system.includes("triage")) {
    body = mockTriageResponse(userText);
  } else {
    body = mockChatResponse(userText);
  }

  // Stream a few characters at a time for a realistic typing effect.
  const chunkSize = 6;
  for (let i = 0; i < body.length; i += chunkSize) {
    yield { type: "delta", text: body.slice(i, i + chunkSize) };
    await sleep(12);
  }
  yield { type: "done" };
}

function mockJson<T>(messages: ChatMessage[], fallback: T): T {
  const lastUser =
    [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const lower = lastUser.toLowerCase();

  const filter: Record<string, unknown> = {};
  if (/\berror(s)?\b|critical|crash/.test(lower)) filter.level = "error";
  else if (/\bwarning(s)?\b/.test(lower)) filter.level = "warning";
  else if (/\binfo\b/.test(lower)) filter.level = "info";

  if (/\breact\b/.test(lower)) filter.projectLanguage = "react";
  else if (/\bnode(\.?js)?\b/.test(lower)) filter.projectLanguage = "node";
  else if (/\bpython\b/.test(lower)) filter.projectLanguage = "python";

  const minMatch = lower.match(/(?:more than|over|>\s*)(\d+)/);
  if (minMatch) filter.minEvents = Number(minMatch[1]);

  const keywordMatch = lastUser.match(
    /\b(null|undefined|timeout|memory|checkout|login|payment|render|hydration|connection|database|sql|fetch)\w*/i,
  );
  if (keywordMatch) filter.search = keywordMatch[0].toLowerCase();

  const result = {
    filter,
    rationale: Object.keys(filter).length
      ? `Mock parsed ${Object.keys(filter).length} filter(s) from your query.`
      : "No filters applied.",
  };
  return (result as unknown as T) ?? fallback;
}

function mockTriageResponse(context: string): string {
  const nameMatch = context.match(/^name:\s*(.+)$/m);
  const messageMatch = context.match(/^message:\s*(.+)$/m);
  const stackHint = context.match(/^\s+at\s+(.+)$/m);
  const errorName = nameMatch?.[1].trim() || "the error";
  const errorMessage = messageMatch?.[1].trim() || "the reported message";
  const location = stackHint?.[1].trim() || "the top of the stack trace";
  const citationMatch = context.match(/\[#([a-z0-9]{4})\]/);
  const citation = citationMatch ? `[#${citationMatch[1]}]` : "";

  return `Summary — ${errorName} is being thrown when the application reaches ${location}, blocking the affected request from completing.

Likely root cause — Based on the message "${errorMessage}" and the top frame of the stack trace, an upstream value is reaching this call site in an unexpected state. ${
    citation
      ? `A similar issue ${citation} previously had the same shape, suggesting a regression in the same code path.`
      : "No closely-related past issues were found, so this appears to be a new failure mode."
  } The most common explanation is a missing guard before the value is dereferenced.

Suggested fix — Add a defensive check before the failing access and either short-circuit or surface a typed error.

\`\`\`ts
if (value == null) {
  throw new TypedError("EXPECTED_VALUE_MISSING", { context: "${location}" });
}
\`\`\`

This makes the failure mode explicit and prevents the crash. Pair it with a regression test that exercises the empty-value branch.

[Note: this response was generated by the local mock provider because OPENAI_API_KEY is not set. Wire a real key to see live model output.]`;
}

function mockChatResponse(userText: string): string {
  const t = userText.toLowerCase();
  if (/test|repro/.test(t)) {
    return `Here is a minimal reproduction you can drop into your test suite:

\`\`\`ts
it("surfaces the failure when the value is missing", () => {
  expect(() => handler(undefined)).toThrow();
});
\`\`\`

Tip: also assert the error type or code so the test stays meaningful if the message string changes.

[Mock response — set OPENAI_API_KEY for live answers.]`;
  }
  if (/before|history|seen/.test(t)) {
    return `Based only on the issue context provided, I can't see the full event history — that lives in the Events tab. What I *can* say:

- The numEvents counter on this issue tells you how many times it has fired in the current window.
- If you see related entries in the "Similar past issues" panel, those are the closest matches by signature.

To confirm whether it has occurred in production before, check the Events tab for occurrences with status: production.

[Mock response — set OPENAI_API_KEY for live answers.]`;
  }
  if (/slack|message|notify/.test(t)) {
    return `Suggested Slack message:

> Heads up — we're seeing an uptick in this error in production. Initial triage suggests a missing guard near the top of the stack. I'm investigating; will post an update within 30 minutes.

[Mock response — set OPENAI_API_KEY for live answers.]`;
  }
  return `Got it. Here's how I'd think about that:

1. The stack trace points to a single failing call site — start there.
2. Check whether the input shape changed recently (deploys, schema migrations, third-party API).
3. Add a guard + a focused test before pushing a fix.

Ask me to "write a test", "draft a Slack update", or "explain frame 3" for more.

[Mock response — set OPENAI_API_KEY for live answers.]`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
