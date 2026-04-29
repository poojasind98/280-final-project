import { PageContainer } from "@features/layout";
import { AlertList } from "@features/alerts";
import type { NextPage } from "next";

const AlertsPage: NextPage = () => {
  return (
    <PageContainer
      title="Alerts"
      metaDescription="ErrSense alert rules — channels, firing status, and notification volume for error spikes and regressions."
      info="Monitor firing rules, notification channels, and recent deliveries tied to your projects."
    >
      <AlertList />
    </PageContainer>
  );
};

export default AlertsPage;
