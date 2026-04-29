import { useTriage } from "../../api/use-triage";
import { StreamedMarkdown } from "../streamed-markdown";
import styles from "./triage-panel.module.scss";

type TriagePanelProps = {
  issueId: string;
};

export function TriagePanel({ issueId }: TriagePanelProps) {
  const {
    text,
    citations,
    isStreaming,
    isDone,
    error,
    provider,
    regenerate,
    stop,
  } = useTriage(issueId);

  return (
    <section
      className={styles.panel}
      aria-labelledby="triage-heading"
      data-testid="ai-triage-panel"
    >
      <header className={styles.header}>
        <div>
          <h2 id="triage-heading" className={styles.title}>
            AI Triage
          </h2>
          <p className={styles.subtitle}>
            Auto-generated from the stack trace and {citations.length} similar
            past {citations.length === 1 ? "issue" : "issues"}.
          </p>
        </div>
        <div className={styles.actions}>
          {isStreaming ? (
            <button
              type="button"
              className={styles.actionButton}
              onClick={stop}
              aria-label="Stop generating"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              className={styles.actionButton}
              onClick={regenerate}
              aria-label="Regenerate triage"
            >
              Regenerate
            </button>
          )}
        </div>
      </header>

      {provider === "mock" && (
        <div className={styles.providerBadge} role="status">
          Mock provider — set OPENAI_API_KEY to use a live model.
        </div>
      )}

      <div
        className={styles.body}
        aria-live="polite"
        aria-busy={isStreaming}
        data-streaming={isStreaming || undefined}
      >
        {text ? <StreamedMarkdown text={text} /> : <Skeleton lines={4} />}
        {isStreaming && <span className={styles.cursor} aria-hidden="true" />}
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {citations.length > 0 && (
        <div className={styles.citations}>
          <h3 className={styles.citationsTitle}>
            Similar past issues used as context
          </h3>
          <ul className={styles.citationList}>
            {citations.map((c) => (
              <li key={c.issueId} className={styles.citation}>
                <span className={styles.citationScore}>
                  {Math.round(c.similarity * 100)}%
                </span>
                <span className={styles.citationName}>{c.name}</span>
                <span className={styles.citationMessage}>{c.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isDone && !error && !text && (
        <p className={styles.empty}>No suggestions could be generated.</p>
      )}
    </section>
  );
}

function Skeleton({ lines }: { lines: number }) {
  return (
    <div aria-hidden="true" className={styles.skeleton}>
      {Array.from({ length: lines }).map((_, i) => (
        <span
          key={i}
          className={styles.skeletonLine}
          style={{ width: `${70 + ((i * 13) % 25)}%` }}
        />
      ))}
    </div>
  );
}
