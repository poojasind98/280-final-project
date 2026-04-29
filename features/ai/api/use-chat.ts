import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "../lib/types";
import { readSSE } from "./sse-client";

type State = {
  messages: ChatMessage[];
  pending: string;
  isStreaming: boolean;
  error: string | null;
};

const initial: State = {
  messages: [],
  pending: "",
  isStreaming: false,
  error: null,
};

/**
 * Manages a streaming chat conversation scoped to a single issue. The server
 * automatically attaches the issue context, so the client only sends the user
 * message history.
 */
export function useChat(issueId: string | null) {
  const [state, setState] = useState<State>(initial);
  const abortRef = useRef<(() => void) | null>(null);

  const send = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !issueId) return;

      const nextHistory: ChatMessage[] = [
        ...state.messages,
        { role: "user", content: trimmed },
      ];
      setState({
        messages: nextHistory,
        pending: "",
        isStreaming: true,
        error: null,
      });

      const { abort } = readSSE(
        "/api/ai/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ issueId, messages: nextHistory }),
        },
        (event, data) => {
          if (event === "delta") {
            const d = data as { text?: string };
            if (d?.text) {
              setState((s) => ({ ...s, pending: s.pending + d.text }));
            }
          } else if (event === "error") {
            const d = data as { message?: string };
            setState((s) => ({
              ...s,
              error: d?.message || "Unknown error",
              isStreaming: false,
            }));
          } else if (event === "done") {
            setState((s) => ({
              messages: s.pending
                ? [...s.messages, { role: "assistant", content: s.pending }]
                : s.messages,
              pending: "",
              isStreaming: false,
              error: null,
            }));
          }
        },
      );
      abortRef.current = abort;
    },
    [issueId, state.messages],
  );

  const stop = useCallback(() => {
    abortRef.current?.();
    setState((s) => ({
      messages: s.pending
        ? [...s.messages, { role: "assistant", content: s.pending }]
        : s.messages,
      pending: "",
      isStreaming: false,
      error: null,
    }));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.();
    setState(initial);
  }, []);

  return { ...state, send, stop, reset };
}
