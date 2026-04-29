import type { NextApiRequest, NextApiResponse } from "next";
import {
  buildChatIssueContext,
  CHAT_SYSTEM_PROMPT,
  findIssueById,
  initSSE,
  isLiveProvider,
  sseClose,
  sseSend,
  streamChat,
} from "@features/ai-server";
import type { ChatMessage } from "@features/ai";

const MAX_HISTORY = 16;
const MAX_CONTENT = 4000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body as {
    issueId?: string;
    messages?: ChatMessage[];
  };
  const issueId = body.issueId;
  const incoming = Array.isArray(body.messages) ? body.messages : [];

  if (!issueId) {
    res.status(400).json({ error: "Missing issueId" });
    return;
  }
  if (incoming.length === 0) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }

  const sanitized: ChatMessage[] = incoming
    .slice(-MAX_HISTORY)
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_CONTENT),
    }));

  const ac = new AbortController();
  req.on("close", () => ac.abort());

  try {
    const issue = await findIssueById(issueId, ac.signal);
    if (!issue) {
      res.status(404).json({ error: "Issue not found" });
      return;
    }

    initSSE(res);
    sseSend(res, "meta", { provider: isLiveProvider() ? "live" : "mock" });

    const messages: ChatMessage[] = [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      { role: "system", content: buildChatIssueContext(issue) },
      ...sanitized,
    ];

    for await (const evt of streamChat(messages, { signal: ac.signal })) {
      if (evt.type === "delta") sseSend(res, "delta", { text: evt.text });
      else if (evt.type === "error")
        sseSend(res, "error", { message: evt.message });
    }
    sseClose(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (!res.writableEnded) {
      try {
        sseSend(res, "error", { message });
        sseClose(res);
      } catch {
        if (!res.headersSent) res.status(500).json({ error: message });
      }
    }
  }
}
