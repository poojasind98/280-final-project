import { useState } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import capitalize from "lodash/capitalize";
import { Badge, BadgeColor, BadgeSize, SkeletonPulse } from "@features/ui";
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

function IssueDetailSkeleton() {
  return (
    <div
      className={styles.loadingShell}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading issue details"
    >
      <div className={styles.loadingCard}>
        <div className={styles.loadingHeader}>
          <div style={{ flex: 1 }}>
            <SkeletonPulse height="2rem" width="55%" rounded="sm" />
            <SkeletonPulse
              height="1rem"
              width="85%"
              rounded="sm"
              className={styles.loadingGapTop}
            />
          </div>
          <SkeletonPulse height="1.625rem" width="5rem" rounded="full" />
        </div>
        <div className={styles.loadingMeta}>
          <SkeletonPulse height="3.25rem" width="100%" rounded="md" />
          <SkeletonPulse height="3.25rem" width="100%" rounded="md" />
          <SkeletonPulse height="3.25rem" width="100%" rounded="md" />
        </div>
        <SkeletonPulse
          height="44px"
          width="180px"
          rounded="md"
          className={styles.loadingGapTop}
        />
      </div>
      <div className={styles.loadingCard}>
        <SkeletonPulse height="1.25rem" width="40%" rounded="sm" />
        <SkeletonPulse
          height="0.875rem"
          width="90%"
          rounded="sm"
          className={styles.loadingGapTop}
        />
        <div className={styles.loadingStackLines}>
          <SkeletonPulse height="0.75rem" width="100%" rounded="sm" />
          <SkeletonPulse height="0.75rem" width="92%" rounded="sm" />
          <SkeletonPulse height="0.75rem" width="78%" rounded="sm" />
        </div>
      </div>
      <div className={styles.loadingCard}>
        <SkeletonPulse height="0.75rem" width="28%" rounded="sm" />
        <div className={styles.loadingStackLines}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonPulse key={i} height="0.75rem" width="100%" rounded="sm" />
          ))}
        </div>
      </div>
    </div>
  );
}

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
      metaDescription="ErrSense issue detail — AI triage, stack trace, and conversational Copilot for production errors."
    >
      <Link href="/dashboard/issues" className={styles.backLink}>
        ← Back to issues
      </Link>

      {issueQuery.isLoading && <IssueDetailSkeleton />}

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
