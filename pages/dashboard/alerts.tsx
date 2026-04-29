import { PageContainer } from "@features/layout";
import { PlaceholderPanel } from "@features/ui";
import { Routes } from "@config/routes";
import type { NextPage } from "next";

const AlertsPage: NextPage = () => {
  return (
    <PageContainer
      title="Alerts"
      metaDescription="ErrSense alerting — notifications for thresholds and regressions (roadmap)."
      info="Configure notifications when error volume spikes or specific signatures regress."
    >
      <PlaceholderPanel
        eyebrow="Roadmap"
        title="Alert rules & notification channels"
        description="Production-grade alerting ties observability to action: Slack, email, PagerDuty-style escalation, and anomaly detection on event counts. This surface is intentionally deferred so the core triage and Copilot flows stay polished — it’s the natural next vertical slice after Issues stabilizes."
        primaryAction={{ label: "View Issues", href: Routes.issues }}
      />
    </PageContainer>
  );
};

export default AlertsPage;
