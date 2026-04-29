import { PageContainer } from "@features/layout";
import { UserList } from "@features/users";
import type { NextPage } from "next";

const UsersPage: NextPage = () => {
  return (
    <PageContainer
      title="Users"
      metaDescription="ErrSense team directory — roles, project access, and membership status."
      info="Manage who can view projects, triage issues, and receive alerts."
    >
      <UserList />
    </PageContainer>
  );
};

export default UsersPage;
