import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ProjectLanguage } from "@api/projects.types";
import { useGetProjects } from "@features/projects";
import { NLFilterBar, type ParsedFilter } from "@features/ai";
import { SkeletonPulse } from "@features/ui";
import { useGetIssues } from "../../api/use-get-issues";
import { IssueRow } from "./issue-row";
import styles from "./issue-list.module.scss";

function IssueTableSkeleton() {
  return (
    <div
      className={styles.container}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading issues"
    >
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            <th className={styles.headerCell}>Issue</th>
            <th className={styles.headerCell}>Level</th>
            <th className={styles.headerCell}>Events</th>
            <th className={styles.headerCell}>Users</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className={styles.skeletonRow}>
              <td>
                <div className={styles.skeletonIssueCell}>
                  <SkeletonPulse
                    width="2.25rem"
                    height="2.25rem"
                    rounded="md"
                  />
                  <div className={styles.skeletonGrow}>
                    <SkeletonPulse height="0.875rem" width="72%" rounded="sm" />
                    <SkeletonPulse height="0.75rem" width="48%" rounded="sm" />
                  </div>
                </div>
              </td>
              <td>
                <SkeletonPulse height="1.5rem" width="4.5rem" rounded="full" />
              </td>
              <td>
                <SkeletonPulse height="1rem" width="2.5rem" rounded="sm" />
              </td>
              <td>
                <SkeletonPulse height="1rem" width="2.5rem" rounded="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.paginationContainer}>
        <div className={styles.skeletonPaginationInner}>
          <SkeletonPulse height="38px" width="88px" rounded="sm" />
          <SkeletonPulse height="38px" width="88px" rounded="sm" />
        </div>
        <SkeletonPulse height="1.25rem" width="10rem" rounded="sm" />
      </div>
    </div>
  );
}

export function IssueList() {
  const router = useRouter();
  const page = Number(router.query.page || 1);
  const navigateToPage = (newPage: number) =>
    router.push({
      pathname: router.pathname,
      query: { page: newPage },
    });

  const issuesPage = useGetIssues(page);
  const projects = useGetProjects();
  const [filter, setFilter] = useState<ParsedFilter>({});

  const projectIdToLanguage = useMemo(
    () =>
      (projects.data || []).reduce(
        (prev, project) => ({
          ...prev,
          [project.id]: project.language,
        }),
        {} as Record<string, ProjectLanguage>,
      ),
    [projects.data],
  );

  const filteredItems = useMemo(() => {
    const items = issuesPage.data?.items || [];
    return items.filter((issue) => {
      if (filter.level && issue.level !== filter.level) return false;
      if (filter.projectLanguage) {
        const lang = projectIdToLanguage[issue.projectId];
        if (lang !== filter.projectLanguage) return false;
      }
      if (
        typeof filter.minEvents === "number" &&
        issue.numEvents < filter.minEvents
      )
        return false;
      if (filter.search) {
        const haystack =
          `${issue.name} ${issue.message} ${issue.stack}`.toLowerCase();
        if (!haystack.includes(filter.search.toLowerCase())) return false;
      }
      return true;
    });
  }, [issuesPage.data, filter, projectIdToLanguage]);

  if (projects.isLoading || issuesPage.isLoading) {
    return (
      <>
        <NLFilterBar value={filter} onChange={setFilter} />
        <IssueTableSkeleton />
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

  if (issuesPage.isError) {
    console.error(issuesPage.error);
    return (
      <>
        <NLFilterBar value={filter} onChange={setFilter} />
        <div className={styles.errorBox} role="alert">
          <strong>Couldn’t load issues.</strong> {issuesPage.error.message}
        </div>
      </>
    );
  }

  const { meta } = issuesPage.data || {};
  const totalShown = filteredItems.length;
  const totalAvailable = issuesPage.data?.items.length || 0;
  const isFiltering = totalShown !== totalAvailable;

  return (
    <>
      <NLFilterBar value={filter} onChange={setFilter} />

      <div className={styles.container}>
        {isFiltering && (
          <div className={styles.filterStatus} aria-live="polite">
            Showing {totalShown} of {totalAvailable} issues on this page.
          </div>
        )}
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.headerCell}>Issue</th>
              <th className={styles.headerCell}>Level</th>
              <th className={styles.headerCell}>Events</th>
              <th className={styles.headerCell}>Users</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                projectLanguage={projectIdToLanguage[issue.projectId]}
              />
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className={styles.emptyState} role="status">
            No issues match your current filters.
          </div>
        )}
        <div className={styles.paginationContainer}>
          <div>
            <button
              className={styles.paginationButton}
              onClick={() => navigateToPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              className={styles.paginationButton}
              onClick={() => navigateToPage(page + 1)}
              disabled={page === meta?.totalPages}
            >
              Next
            </button>
          </div>
          <div className={styles.pageInfo}>
            Page <span className={styles.pageNumber}>{meta?.currentPage}</span>{" "}
            of <span className={styles.pageNumber}>{meta?.totalPages}</span>
          </div>
        </div>
      </div>
    </>
  );
}
