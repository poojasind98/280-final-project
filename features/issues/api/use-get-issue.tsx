import { useQuery } from "@tanstack/react-query";
import { getIssues } from "@api/issues";
import type { Issue } from "@api/issues.types";

const QUERY_KEY = "issue";
const MAX_PAGES = 3;

/**
 * Look up a single issue by id by walking the paginated list endpoint. The
 * upstream mock API exposes no /issue/:id route, so we fan out across the
 * first few pages and stop early once we hit the target. Cached aggressively.
 */
export function useGetIssue(issueId: string | undefined) {
  return useQuery<Issue | null, Error>(
    [QUERY_KEY, issueId],
    async ({ signal }) => {
      if (!issueId) return null;
      for (let page = 1; page <= MAX_PAGES; page++) {
        const data = await getIssues(page, { signal });
        const found = data.items.find((i) => i.id === issueId);
        if (found) return found;
        if (!data.meta.hasNextPage) break;
      }
      return null;
    },
    { enabled: Boolean(issueId), staleTime: 60_000 },
  );
}
