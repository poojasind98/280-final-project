import { Fragment } from "react";
import styles from "./streamed-markdown.module.scss";

type StreamedMarkdownProps = {
  text: string;
};

/**
 * Minimal markdown renderer for AI streaming output. Handles fenced code
 * blocks and inline code; everything else is rendered as text. Intentionally
 * tiny so we can render partial/incomplete markdown safely while a response
 * is still streaming in.
 */
export function StreamedMarkdown({ text }: StreamedMarkdownProps) {
  const parts = parseFences(text);
  return (
    <>
      {parts.map((part, i) =>
        part.type === "code" ? (
          <pre key={i} className={styles.code}>
            <code>{part.value}</code>
          </pre>
        ) : (
          <Fragment key={i}>{renderInline(part.value)}</Fragment>
        ),
      )}
    </>
  );
}

type Part = { type: "text" | "code"; value: string };

function parseFences(text: string): Part[] {
  const out: Part[] = [];
  let i = 0;
  while (i < text.length) {
    const fenceStart = text.indexOf("```", i);
    if (fenceStart === -1) {
      out.push({ type: "text", value: text.slice(i) });
      break;
    }
    if (fenceStart > i) {
      out.push({ type: "text", value: text.slice(i, fenceStart) });
    }
    // Skip language tag if present.
    const newlineAfterOpen = text.indexOf("\n", fenceStart + 3);
    const codeStart =
      newlineAfterOpen === -1 ? fenceStart + 3 : newlineAfterOpen + 1;
    const fenceEnd = text.indexOf("```", codeStart);
    if (fenceEnd === -1) {
      // Unterminated fence (still streaming) — render the partial code block.
      out.push({ type: "code", value: text.slice(codeStart) });
      break;
    }
    out.push({ type: "code", value: text.slice(codeStart, fenceEnd) });
    i = fenceEnd + 3;
  }
  return out;
}

function renderInline(text: string) {
  // Inline `code` only. Everything else is plain text (preserves whitespace
  // via `white-space: pre-wrap` on the parent).
  const segments = text.split(/(`[^`\n]+`)/g);
  return segments.map((seg, i) =>
    seg.startsWith("`") && seg.endsWith("`") && seg.length > 2 ? (
      <code key={i} className={styles.inlineCode}>
        {seg.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={i}>{seg}</Fragment>
    ),
  );
}
