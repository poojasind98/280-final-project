import type { NextPage } from "next";
import { PageContainer } from "@features/layout";
import { ProjectList } from "@features/projects";

const Home: NextPage = () => {
  return (
    <PageContainer
      title="Projects"
      metaDescription="ErrSense projects dashboard — monitor error volume and drill into issues per codebase."
      info="Overview of your projects sorted by alert level."
    >
      <ProjectList />
    </PageContainer>
  );
};

export default Home;
