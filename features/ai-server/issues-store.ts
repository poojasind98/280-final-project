import type { Issue } from "@api/issues.types";
import type { Page } from "@typings/page.types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const TTL_MS = 5 * 60_000;
const MAX_PAGES = 3;

let cache: { ts: number; issues: Issue[] } | null = null;

/**
 * Fetches a bounded slice of all issues from the upstream mock API and caches
 * them in-memory for the lifetime of the server process. Used as the corpus
 * for similarity search and as a fallback look-up when the client requests an
 * issue by id.
 */
export async function loadIssueCorpus(signal?: AbortSignal): Promise<Issue[]> {
  if (cache && Date.now() - cache.ts < TTL_MS) {
    return cache.issues;
  }
  if (!BASE) return [];

  const all: Issue[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const res = await fetch(`${BASE}/issue?page=${page}`, { signal });
      if (!res.ok) break;
      const data = (await res.json()) as Page<Issue>;
      all.push(...data.items);
      if (!data.meta.hasNextPage) break;
    } catch {
      break;
    }
  }
  cache = { ts: Date.now(), issues: all };
  return all;
}

export async function findIssueById(
  id: string,
  signal?: AbortSignal,
): Promise<Issue | null> {
  const corpus = await loadIssueCorpus(signal);
  return corpus.find((i) => i.id === id) || null;
}
