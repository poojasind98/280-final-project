import { FormEvent, useState } from "react";
import { useNLFilter } from "../../api/use-nl-filter";
import type { ParsedFilter } from "../../lib/types";
import styles from "./nl-filter-bar.module.scss";

type NLFilterBarProps = {
  value: ParsedFilter;
  onChange: (filter: ParsedFilter) => void;
};

const EXAMPLES = [
  "high severity react errors",
  "node.js timeouts seen more than 50 times",
  "python null pointer issues",
];

export function NLFilterBar({ value, onChange }: NLFilterBarProps) {
  const [query, setQuery] = useState("");
  const { result, isLoading, error, parse } = useNLFilter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const parsed = await parse(query);
    if (parsed) onChange(parsed.filter);
  };

  const handleExample = async (text: string) => {
    setQuery(text);
    const parsed = await parse(text);
    if (parsed) onChange(parsed.filter);
  };

  const filterChips = toChips(value);
  const hasActiveFilters = filterChips.length > 0;

  return (
    <div className={styles.bar} role="search">
      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="nl-filter-input" className={styles.srOnly}>
          Describe what to find
        </label>
        <span className={styles.icon} aria-hidden="true">
          ✦
        </span>
        <input
          id="nl-filter-input"
          type="text"
          className={styles.input}
          placeholder='Try: "react errors with more than 100 events"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className={styles.button}
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? "Parsing…" : "Filter with AI"}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              setQuery("");
              onChange({});
            }}
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {result?.rationale && !error && (
        <p className={styles.rationale} aria-live="polite">
          <strong>AI:</strong> {result.rationale}
        </p>
      )}

      {hasActiveFilters && (
        <ul className={styles.chips} aria-label="Active filters">
          {filterChips.map((chip) => (
            <li key={chip.key} className={styles.chip}>
              <span className={styles.chipLabel}>
                {chip.label}: <strong>{chip.value}</strong>
              </span>
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => onChange({ ...value, [chip.key]: undefined })}
                aria-label={`Remove ${chip.label} filter`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {!hasActiveFilters && !query && (
        <div className={styles.examples}>
          <span className={styles.examplesLabel}>Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className={styles.exampleChip}
              onClick={() => handleExample(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function toChips(filter: ParsedFilter) {
  const out: Array<{ key: keyof ParsedFilter; label: string; value: string }> =
    [];
  if (filter.level)
    out.push({ key: "level", label: "Level", value: filter.level });
  if (filter.projectLanguage)
    out.push({
      key: "projectLanguage",
      label: "Language",
      value: filter.projectLanguage,
    });
  if (filter.search)
    out.push({ key: "search", label: "Search", value: `"${filter.search}"` });
  if (typeof filter.minEvents === "number")
    out.push({
      key: "minEvents",
      label: "Min events",
      value: String(filter.minEvents),
    });
  return out;
}
