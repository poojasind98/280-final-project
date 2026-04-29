import { useState } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import capitalize from "lodash/capitalize";
import { Badge, BadgeColor, BadgeSize } from "@features/ui";
import { PageContainer } from "@features/layout";
import { CopilotDrawer, TriagePanel } from "@features/ai";
import { useGetIssue } from "@features/issues";
import { useGetProjects } from "@features/projects";
import { IssueLevel } from "@api/issues.types";
import styles from "./issue-detail.module.scss";

const levelColors = {
  [IssueLevel.info]: BadgeColor.success,
  [IssueLevel.warning]: BadgeColor.warning,
  [IssueLevel.error]: BadgeColor.error,
};

const IssueDetailPage: NextPage = () => {
  const router = useRouter();
  const issueId =
    typeof router.query.issueId === "string" ? router.query.issueId : undefined;

  const issueQuery = useGetIssue(issueId);
  const projectsQuery = useGetProjects();
  const [isCopilotOpen, setCopilotOpen] = useState(false);

  return (
    <PageContainer
      title="Issue Detail"
      info="Inspect an individual error and ask the Copilot for help."
    >
      <Link href="/dashboard/issues" className={styles.backLink}>
        ← Back to issues
      </Link>

      {issueQuery.isLoading && (
        <div className={styles.state}>Loading issue…</div>
      )}

      {issueQuery.isError && (
        <div className={styles.error} role="alert">
          Couldn’t load this issue: {issueQuery.error.message}
        </div>
      )}

      {!issueQuery.isLoading && !issueQuery.data && (
        <div className={styles.state}>
          We couldn’t find an issue with id <code>{issueId}</code>.
        </div>
      )}

      {issueQuery.data && (
        <>
          <article className={styles.summary} aria-labelledby="issue-name">
            <header className={styles.summaryHeader}>
              <div>
                <h2 id="issue-name" className={styles.errorName}>
                  {issueQuery.data.name}
                </h2>
                <p className={styles.errorMessage}>{issueQuery.data.message}</p>
              </div>
              <Badge
                color={levelColors[issueQuery.data.level]}
                size={BadgeSize.md}
              >
                {capitalize(issueQuery.data.level)}
              </Badge>
            </header>

            <dl className={styles.meta}>
              <div>
                <dt>Project</dt>
                <dd>
                  {projectsQuery.data?.find(
                    (p) => p.id === issueQuery.data?.projectId,
                  )?.name || issueQuery.data.projectId}
                </dd>
              </div>
              <div>
                <dt>Events</dt>
                <dd>{issueQuery.data.numEvents.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Issue ID</dt>
                <dd>
                  <code>{issueQuery.data.id}</code>
                </dd>
              </div>
            </dl>

            <button
              type="button"
              className={styles.copilotButton}
              onClick={() => setCopilotOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isCopilotOpen}
            >
              <span aria-hidden="true">✦</span> Ask Copilot
            </button>
          </article>

          <TriagePanel issueId={issueQuery.data.id} />

          <section className={styles.stackSection} aria-labelledby="stack-h">
            <h2 id="stack-h" className={styles.stackTitle}>
              Stack trace
            </h2>
            <pre className={styles.stack}>
              <code>{issueQuery.data.stack || "(no stack trace)"}</code>
            </pre>
          </section>

          <CopilotDrawer
            issueId={issueQuery.data.id}
            isOpen={isCopilotOpen}
            onClose={() => setCopilotOpen(false)}
          />
        </>
      )}
    </PageContainer>
  );
};

export default IssueDetailPage;
