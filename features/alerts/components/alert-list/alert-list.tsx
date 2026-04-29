import { useMemo, useState } from "react";
import classNames from "classnames";
import { AlertState } from "@api/alerts.types";
import { useGetProjects } from "@features/projects";
import { ProjectLanguage } from "@api/projects.types";
import { SkeletonPulse } from "@features/ui";
import { useGetAlerts } from "../../api/use-get-alerts";
import { AlertRow } from "./alert-row";
import styles from "./alert-list.module.scss";

type StatusFilter = "all" | AlertState;

const FILTER_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: AlertState.firing, label: "Firing" },
  { id: AlertState.ok, label: "Healthy" },
  { id: AlertState.muted, label: "Muted" },
];

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const sec = Math.round((Date.now() - then) / 1000);
  if (sec < 0) return "just now";

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (sec < 45) return rtf.format(-Math.max(sec, 1), "second");
  const min = Math.round(sec / 60);
  if (min < 60) return rtf.format(-min, "minute");
  const hr = Math.round(min / 60);
  if (hr < 48) return rtf.format(-hr, "hour");
  const day = Math.round(hr / 24);
  if (day < 14) return rtf.format(-day, "day");
  const week = Math.round(day / 7);
  if (week < 8) return rtf.format(-week, "week");
  const month = Math.round(day / 30);
  return rtf.format(-Math.max(month, 1), "month");
}

function AlertTableSkeleton() {
  return (
    <div
      className={styles.container}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading alerts"
    >
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            <th className={styles.headerCell}>Rule</th>
            <th className={styles.headerCell}>Channel</th>
            <th className={styles.headerCell}>Status</th>
            <th className={styles.headerCell}>Last triggered</th>
            <th className={styles.headerCell}>24h volume</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className={styles.skeletonRow}>
              <td>
                <div className={styles.skeletonRuleCell}>
                  <SkeletonPulse
                    width="2.25rem"
                    height="2.25rem"
                    rounded="md"
                  />
                  <div className={styles.skeletonGrow}>
                    <SkeletonPulse height="0.875rem" width="68%" rounded="sm" />
                    <SkeletonPulse height="0.75rem" width="88%" rounded="sm" />
                  </div>
                </div>
              </td>
              <td>
                <SkeletonPulse height="1.5rem" width="4.25rem" rounded="full" />
              </td>
              <td>
                <SkeletonPulse height="1.5rem" width="4rem" rounded="full" />
              </td>
              <td>
                <SkeletonPulse height="1rem" width="5rem" rounded="sm" />
              </td>
              <td>
                <SkeletonPulse height="1rem" width="2rem" rounded="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AlertList() {
  const alertsQuery = useGetAlerts();
  const projects = useGetProjects();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const projectById = useMemo(() => {
    const map = new Map<string, { name: string; language: ProjectLanguage }>();
    (projects.data || []).forEach((p) =>
      map.set(p.id, { name: p.name, language: p.language }),
    );
    return map;
  }, [projects.data]);

  const filteredAlerts = useMemo(() => {
    const items = alertsQuery.data || [];
    if (filter === "all") return items;
    return items.filter((a) => a.state === filter);
  }, [alertsQuery.data, filter]);

  if (projects.isLoading || alertsQuery.isLoading) {
    return (
      <>
        <div className={styles.toolbar} role="group" aria-label="Filter alerts">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={styles.filterButton}
              disabled
            >
              {opt.label}
            </button>
          ))}
        </div>
        <AlertTableSkeleton />
      </>
    );
  }

  if (projects.isError) {
    console.error(projects.error);
    return (
      <div className={styles.errorBox} role="alert">
        <strong>Couldn’t load projects.</strong> {projects.error.message}
      </div>
    );
  }

  if (alertsQuery.isError) {
    console.error(alertsQuery.error);
    return (
      <div className={styles.errorBox} role="alert">
        <strong>Couldn’t load alerts.</strong> {alertsQuery.error.message}
      </div>
    );
  }

  const total = alertsQuery.data?.length ?? 0;
  const isFiltering = filter !== "all" && filteredAlerts.length !== total;

  return (
    <>
      <div className={styles.toolbar} role="group" aria-label="Filter alerts">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={classNames(
              styles.filterButton,
              filter === opt.id && styles.filterButtonActive,
            )}
            aria-pressed={filter === opt.id}
            onClick={() => setFilter(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className={styles.container}>
        {isFiltering && (
          <div className={styles.filterStatus} aria-live="polite">
            Showing {filteredAlerts.length} of {total} rules.
          </div>
        )}
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.headerCell}>Rule</th>
              <th className={styles.headerCell}>Channel</th>
              <th className={styles.headerCell}>Status</th>
              <th className={styles.headerCell}>Last triggered</th>
              <th className={styles.headerCell}>24h volume</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.map((alert) => {
              const meta = projectById.get(alert.projectId);
              return (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  projectLanguage={meta?.language}
                  projectName={meta?.name ?? "Unknown project"}
                  relativeLastTriggered={formatRelative(alert.lastTriggeredAt)}
                />
              );
            })}
          </tbody>
        </table>
        {filteredAlerts.length === 0 && (
          <div className={styles.emptyState} role="status">
            No alert rules match this filter.
          </div>
        )}
      </div>

      <p className={styles.footnote}>
        Rules shown are demo data bundled with ErrSense. Connect your notifier
        endpoints in production to drive real deliveries.
      </p>
    </>
  );
}
