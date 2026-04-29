import { PageContainer } from "@features/layout";
import { IssueList } from "@features/issues";
import type { NextPage } from "next";

const IssuesPage: NextPage = () => {
  return (
    <PageContainer
      title="Issues"
      metaDescription="ErrSense issues — natural-language filters, severity scanning, and AI triage entry points."
      info="Overview of errors, warnings, and events logged from your projects."
    >
      <IssueList />
    </PageContainer>
  );
};

export default IssuesPage;
