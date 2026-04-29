import { PageContainer } from "@features/layout";
import { PlaceholderPanel } from "@features/ui";
import { Routes } from "@config/routes";
import type { NextPage } from "next";

const SettingsPage: NextPage = () => {
  return (
    <PageContainer
      title="Settings"
      metaDescription="ErrSense account settings — API keys, data retention, appearance (roadmap)."
      info="Workspace preferences, integrations, and privacy controls."
    >
      <PlaceholderPanel
        eyebrow="Roadmap"
        title="Workspace settings"
        description="Account-wide controls — SSO, API tokens for ingestion, data retention windows, and appearance presets — belong here. Keeping Settings as an explicit placeholder preserves realistic IA while signaling honest scope: we invested UX depth where users spend time (Issues + Copilot)."
        primaryAction={{ label: "Go to Projects", href: Routes.projects }}
      />
    </PageContainer>
  );
};

export default SettingsPage;
