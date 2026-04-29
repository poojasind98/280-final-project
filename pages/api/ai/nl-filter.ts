import type { NextApiRequest, NextApiResponse } from "next";
import { completeJson, NL_FILTER_SYSTEM_PROMPT } from "@features/ai-server";
import type { NLFilterResult } from "@features/ai-server";

const MAX_QUERY = 300;
const ALLOWED_LEVEL = new Set(["info", "warning", "error"]);
const ALLOWED_LANG = new Set(["react", "node", "python"]);

const EMPTY: NLFilterResult = { filter: {}, rationale: "No filters applied." };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NLFilterResult>,
) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  const query = String((req.body as { query?: string })?.query || "")
    .trim()
    .slice(0, MAX_QUERY);

  if (!query) {
    res.status(200).json(EMPTY);
    return;
  }

  const ac = new AbortController();
  req.on("close", () => ac.abort());

  const raw = await completeJson<NLFilterResult>(
    [
      { role: "system", content: NL_FILTER_SYSTEM_PROMPT },
      { role: "user", content: query },
    ],
    EMPTY,
    { signal: ac.signal },
  );

  res.status(200).json(sanitize(raw));
}

function sanitize(raw: NLFilterResult): NLFilterResult {
  const f = raw?.filter || {};
  const out: NLFilterResult["filter"] = {};
  if (typeof f.level === "string" && ALLOWED_LEVEL.has(f.level)) {
    out.level = f.level;
  }
  if (
    typeof f.projectLanguage === "string" &&
    ALLOWED_LANG.has(f.projectLanguage)
  ) {
    out.projectLanguage = f.projectLanguage;
  }
  if (typeof f.search === "string" && f.search.trim()) {
    out.search = f.search.trim().slice(0, 80);
  }
  if (typeof f.minEvents === "number" && Number.isFinite(f.minEvents)) {
    out.minEvents = Math.max(0, Math.floor(f.minEvents));
  }
  return {
    filter: out,
    rationale:
      typeof raw?.rationale === "string" && raw.rationale.length
        ? raw.rationale.slice(0, 240)
        : EMPTY.rationale,
  };
}
