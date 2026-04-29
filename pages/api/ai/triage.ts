import type { NextApiRequest, NextApiResponse } from "next";
import {
  buildCitations,
  buildTriageContext,
  findIssueById,
  initSSE,
  isLiveProvider,
  loadIssueCorpus,
  rankSimilarIssues,
  sseClose,
  sseSend,
  streamChat,
  TRIAGE_SYSTEM_PROMPT,
} from "@features/ai-server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const issueId = String(req.query.issueId || "");
  if (!issueId) {
    res.status(400).json({ error: "Missing issueId" });
    return;
  }

  const ac = new AbortController();
  req.on("close", () => ac.abort());

  try {
    const [target, corpus] = await Promise.all([
      findIssueById(issueId, ac.signal),
      loadIssueCorpus(ac.signal),
    ]);

    if (!target) {
      res.status(404).json({ error: "Issue not found" });
      return;
    }

    const similar = rankSimilarIssues(target, corpus, 4);
    const citations = buildCitations(similar);

    initSSE(res);
    sseSend(res, "meta", {
      citations,
      provider: isLiveProvider() ? "live" : "mock",
    });

    const userPayload = buildTriageContext(target, similar);

    for await (const evt of streamChat(
      [
        { role: "system", content: TRIAGE_SYSTEM_PROMPT },
        { role: "user", content: userPayload },
      ],
      { signal: ac.signal },
    )) {
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
