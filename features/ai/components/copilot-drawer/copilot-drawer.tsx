import {
  KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import classNames from "classnames";
import { useChat } from "../../api/use-chat";
import { StreamedMarkdown } from "../streamed-markdown";
import styles from "./copilot-drawer.module.scss";

type CopilotDrawerProps = {
  issueId: string;
  isOpen: boolean;
  onClose: () => void;
};

const SUGGESTIONS = [
  "Explain this stack trace in plain English",
  "Write a unit test that reproduces this",
  "Has this happened in production before?",
  "Draft a short Slack update for the team",
];

export function CopilotDrawer({
  issueId,
  isOpen,
  onClose,
}: CopilotDrawerProps) {
  const { messages, pending, isStreaming, error, send, stop, reset } =
    useChat(issueId);
  const [input, setInput] = useState("");
  const drawerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  // Trap focus while open + restore on close (a11y).
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "Tab") {
        const root = drawerRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'a, button, textarea, input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [isOpen, onClose]);

  // Auto-scroll to bottom as new content streams in.
  useLayoutEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, pending]);

  if (!isOpen) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    send(text);
    setInput("");
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <aside
        ref={drawerRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="copilot-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h2 id="copilot-title" className={styles.title}>
              ErrSense Copilot
            </h2>
            <p className={styles.subtitle}>
              Ask questions about this issue. Context is auto-attached.
            </p>
          </div>
          <div className={styles.headerActions}>
            {messages.length > 0 && (
              <button
                type="button"
                className={styles.iconButton}
                onClick={reset}
                aria-label="Reset conversation"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className={styles.iconButton}
              onClick={onClose}
              aria-label="Close Copilot"
            >
              ✕
            </button>
          </div>
        </header>

        <div className={styles.messages} ref={messagesRef} aria-live="polite">
          {messages.length === 0 && !pending && (
            <div className={styles.intro}>
              <p>
                I have the stack trace, level, and recent event count for this
                issue. Try one of these:
              </p>
              <ul className={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className={styles.suggestion}
                      onClick={() => send(s)}
                      disabled={isStreaming}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((m, i) => (
            <Message key={i} role={m.role} content={m.content} />
          ))}

          {pending && <Message role="assistant" content={pending} streaming />}

          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
        </div>

        <form
          className={styles.composer}
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <label htmlFor="copilot-input" className={styles.srOnly}>
            Ask the Copilot
          </label>
          <textarea
            id="copilot-input"
            ref={inputRef}
            className={styles.textarea}
            placeholder="Ask about this issue…  (Enter to send, Shift+Enter for newline)"
            value={input}
            rows={2}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={isStreaming}
          />
          <div className={styles.composerActions}>
            {isStreaming ? (
              <button
                type="button"
                className={styles.stopButton}
                onClick={stop}
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                className={styles.sendButton}
                disabled={!input.trim()}
              >
                Send
              </button>
            )}
          </div>
        </form>
      </aside>
    </div>
  );
}

type MessageProps = {
  role: "user" | "assistant" | "system";
  content: string;
  streaming?: boolean;
};

function Message({ role, content, streaming }: MessageProps) {
  return (
    <div
      className={classNames(
        styles.message,
        role === "user" ? styles.userMessage : styles.assistantMessage,
      )}
    >
      <div className={styles.messageRole} aria-hidden="true">
        {role === "user" ? "You" : "Copilot"}
      </div>
      <div className={styles.messageBody}>
        <StreamedMarkdown text={content} />
        {streaming && <span className={styles.cursor} aria-hidden="true" />}
      </div>
    </div>
  );
}
