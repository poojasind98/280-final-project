import { useCallback, useRef, useState } from "react";
import type { NLFilterResult } from "../lib/types";

type State = {
  result: NLFilterResult | null;
  isLoading: boolean;
  error: string | null;
};

const initial: State = { result: null, isLoading: false, error: null };

export function useNLFilter() {
  const [state, setState] = useState<State>(initial);
  const acRef = useRef<AbortController | null>(null);

  const parse = useCallback(async (query: string) => {
    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;
    setState({ result: null, isLoading: true, error: null });
    try {
      const res = await fetch("/api/ai/nl-filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as NLFilterResult;
      setState({ result: data, isLoading: false, error: null });
      return data;
    } catch (err) {
      if (ac.signal.aborted) return null;
      const message = err instanceof Error ? err.message : "Request failed";
      setState({ result: null, isLoading: false, error: message });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    acRef.current?.abort();
    setState(initial);
  }, []);

  return { ...state, parse, reset };
}
