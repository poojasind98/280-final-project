/**
 * Minimal SSE-over-fetch reader. Parses `event:` + `data:` blocks and invokes
 * the supplied handler. Returns an abort function so callers can cancel the
 * underlying request — important for stop/regenerate UX in the chat drawer.
 */
export type SSEHandler = (event: string, data: unknown) => void;

export function readSSE(
  url: string,
  init: RequestInit,
  handler: SSEHandler,
): { promise: Promise<void>; abort: () => void } {
  const ac = new AbortController();
  const signal = ac.signal;

  const promise = (async () => {
    const res = await fetch(url, { ...init, signal });
    if (!res.ok || !res.body) {
      handler("error", {
        message: `Request failed (${res.status})`,
      });
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streaming = true;

    while (streaming) {
      const { value, done } = await reader.read();
      if (done) {
        streaming = false;
        break;
      }
      buffer += decoder.decode(value, { stream: true });

      let idx;
      // Frames are separated by a blank line per the SSE spec.
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const event = parseFrame(frame);
        if (event) handler(event.event, event.data);
      }
    }
  })().catch((err) => {
    if (signal.aborted) return;
    handler("error", {
      message: err instanceof Error ? err.message : "Stream error",
    });
  });

  return { promise, abort: () => ac.abort() };
}

function parseFrame(frame: string): { event: string; data: unknown } | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  const dataStr = dataLines.join("\n");
  try {
    return { event, data: JSON.parse(dataStr) };
  } catch {
    return { event, data: dataStr };
  }
}
