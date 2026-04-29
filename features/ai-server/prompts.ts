import type { Issue } from "@api/issues.types";
import type { TriageCitation } from "../ai/lib/types";

export const TRIAGE_SYSTEM_PROMPT = `You are ErrSense Copilot, an expert software engineer helping on-call developers triage production errors. You are concise, precise, and pragmatic. You never invent stack frames, file paths, or library APIs that are not in the provided context.

When responding to a triage request, return THREE sections in this exact order, each as plain prose (no markdown headers):
1. Summary — one sentence describing what is happening.
2. Likely root cause — 2-4 sentences using the stack trace and similar past issues as evidence. Cite past issues by their short id like [#a1b2].
3. Suggested fix — a small, copy-pasteable code snippet (use a fenced code block) plus a 1-2 sentence rationale.

If the context is insufficient, say so plainly rather than guessing.`;

export const CHAT_SYSTEM_PROMPT = `You are ErrSense Copilot, an AI pair-debugger embedded in an error-monitoring dashboard. You help engineers understand and resolve a specific production issue.

Behaviour:
- Always ground your answers in the provided ISSUE CONTEXT block.
- Be concise; prefer bullet points for lists, fenced code for snippets.
- When you suggest a fix, point to the file/line if it appears in the stack trace.
- If asked about something not in context (e.g. "has this happened before?"), say what you can infer and what would need to be checked manually.
- Never fabricate stack frames, file paths, environment values, or API behaviours that aren't in the context.`;

export const NL_FILTER_SYSTEM_PROMPT = `You translate a user's natural-language description into a STRUCTURED filter for an issue list.

Output ONLY valid minified JSON matching this schema, with no prose, no markdown, no code fences:
{"filter":{"level"?:"info"|"warning"|"error","projectLanguage"?:"react"|"node"|"python","search"?:string,"minEvents"?:number},"rationale":string}

Rules:
- Omit any field the user did not clearly imply. Do not guess.
- "search" is a free-text substring matched against issue name + message; use it for keywords like "null", "timeout", "checkout".
- "rationale" is one short sentence that the UI will display as a transparency note.
- If the input is empty or unintelligible, return {"filter":{},"rationale":"No filters applied."}.`;

export function buildTriageContext(
  target: Issue,
  similar: Array<{ issue: Issue; similarity: number }>,
): string {
  const stack = target.stack
    ? target.stack.split("\n").slice(0, 12).join("\n")
    : "(no stack trace)";

  const similarBlock = similar.length
    ? similar
        .map(
          ({ issue, similarity }) =>
            `[#${shortId(issue.id)}] (similarity ${similarity.toFixed(
              2,
            )})\n  name: ${issue.name}\n  message: ${issue.message}\n  level: ${
              issue.level
            }\n  numEvents: ${issue.numEvents}`,
        )
        .join("\n\n")
    : "(none found)";

  return `TARGET ISSUE
id: ${target.id}
name: ${target.name}
message: ${target.message}
level: ${target.level}
numEvents: ${target.numEvents}
stack:
${stack}

SIMILAR PAST ISSUES
${similarBlock}`;
}

export function buildChatIssueContext(issue: Issue): string {
  const stack = issue.stack
    ? issue.stack.split("\n").slice(0, 16).join("\n")
    : "(no stack trace)";

  return `ISSUE CONTEXT
id: ${issue.id}
name: ${issue.name}
message: ${issue.message}
level: ${issue.level}
numEvents: ${issue.numEvents}
stack:
${stack}`;
}

export function buildCitations(
  similar: Array<{ issue: Issue; similarity: number }>,
): TriageCitation[] {
  return similar.map(({ issue, similarity }) => ({
    issueId: issue.id,
    name: issue.name,
    message: issue.message,
    similarity,
  }));
}

export function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 4);
}
