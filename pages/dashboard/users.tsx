import { PageContainer } from "@features/layout";
import { PlaceholderPanel } from "@features/ui";
import { Routes } from "@config/routes";
import type { NextPage } from "next";

const UsersPage: NextPage = () => {
  return (
    <PageContainer
      title="Users"
      metaDescription="ErrSense team access — invite collaborators and manage roles (roadmap)."
      info="Manage who can view projects, triage issues, and receive alerts."
    >
      <PlaceholderPanel
        eyebrow="Roadmap"
        title="Team access & roles"
        description="ErrSense today focuses on fast AI-assisted triage. Multi-seat collaboration — invitations, role-based access (admin / viewer), and per-project membership — is planned next so organizations can mirror how real incident workflows operate."
        primaryAction={{ label: "Back to Issues", href: Routes.issues }}
      />
    </PageContainer>
  );
};

export default UsersPage;
