import { ProjectCard } from "../project-card";
import { useGetProjects } from "../../api/use-get-projects";
import { SkeletonPulse } from "@features/ui";
import styles from "./project-list.module.scss";

function ProjectListSkeleton() {
  return (
    <ul
      className={styles.skeletonGrid}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading projects"
    >
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <div className={styles.skeletonCard}>
            <div className={styles.skeletonRow}>
              <SkeletonPulse
                className={styles.skeletonIcon}
                width="2.5rem"
                height="2.5rem"
                rounded="md"
              />
              <div className={styles.skeletonGrow}>
                <SkeletonPulse height="1rem" width="55%" rounded="sm" />
                <SkeletonPulse height="0.75rem" width="35%" rounded="sm" />
              </div>
            </div>
            <div className={styles.skeletonStats}>
              <SkeletonPulse height="2.5rem" width="4rem" rounded="sm" />
              <SkeletonPulse height="2.5rem" width="4rem" rounded="sm" />
              <SkeletonPulse height="1.75rem" width="5rem" rounded="full" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ProjectList() {
  const { data, isLoading, isError, error } = useGetProjects();

  if (isLoading) {
    return <ProjectListSkeleton />;
  }

  if (isError) {
    console.error(error);
    return (
      <div className={styles.errorBox} role="alert">
        <strong>Couldn’t load projects.</strong> {error.message}
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {data?.map((project) => (
        <li key={project.id}>
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  );
}
