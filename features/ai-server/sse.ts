import type { NextApiResponse } from "next";

/**
 * Initialize a Server-Sent Events response. Disables Nginx buffering, sets
 * keep-alive headers, and flushes immediately so the client receives data as
 * it streams from the upstream model.
 */
export function initSSE(res: NextApiResponse) {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  // Some Node servers buffer until the first flush.
  if (
    typeof (res as unknown as { flushHeaders?: () => void }).flushHeaders ===
    "function"
  ) {
    (res as unknown as { flushHeaders: () => void }).flushHeaders();
  }
}

export function sseSend(res: NextApiResponse, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function sseClose(res: NextApiResponse) {
  res.write(`event: done\ndata: {}\n\n`);
  res.end();
}
