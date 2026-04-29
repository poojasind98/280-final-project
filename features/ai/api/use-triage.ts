import { useCallback, useEffect, useRef, useState } from "react";
import type { TriageCitation } from "../lib/types";
import { readSSE } from "./sse-client";

type State = {
  text: string;
  citations: TriageCitation[];
  isStreaming: boolean;
  isDone: boolean;
  error: string | null;
  provider: "live" | "mock" | null;
};

const initial: State = {
  text: "",
  citations: [],
  isStreaming: false,
  isDone: false,
  error: null,
  provider: null,
};

/**
 * Streams a triage response for a given issue id. Auto-runs on mount and
 * exposes a `regenerate` action. Cancels the in-flight stream on unmount.
 */
export function useTriage(issueId: string | null) {
  const [state, setState] = useState<State>(initial);
  const abortRef = useRef<(() => void) | null>(null);

  const run = useCallback(() => {
    if (!issueId) return;
    abortRef.current?.();
    setState({ ...initial, isStreaming: true });

    const { abort } = readSSE(
      `/api/ai/triage?issueId=${encodeURIComponent(issueId)}`,
      { method: "GET" },
      (event, data) => {
        if (event === "meta") {
          const meta = data as {
            citations?: TriageCitation[];
            provider?: "live" | "mock";
          };
          setState((s) => ({
            ...s,
            citations: meta.citations || [],
            provider: meta.provider || null,
          }));
        } else if (event === "delta") {
          const d = data as { text?: string };
          if (d?.text) {
            setState((s) => ({ ...s, text: s.text + d.text }));
          }
        } else if (event === "error") {
          const d = data as { message?: string };
          setState((s) => ({
            ...s,
            error: d?.message || "Unknown error",
            isStreaming: false,
          }));
        } else if (event === "done") {
          setState((s) => ({ ...s, isStreaming: false, isDone: true }));
        }
      },
    );
    abortRef.current = abort;
  }, [issueId]);

  useEffect(() => {
    run();
    return () => abortRef.current?.();
  }, [run]);

  const stop = useCallback(() => {
    abortRef.current?.();
    setState((s) => ({ ...s, isStreaming: false }));
  }, []);

  return { ...state, regenerate: run, stop };
}
