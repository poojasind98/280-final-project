import { Routes } from "@config/routes";
import { BrandLogo } from "@features/layout";
import styles from "./index.module.scss";

const IssuesPage = () => {
  return (
    <div>
      <header className={styles.header}>
        <BrandLogo />
        <a href={Routes.projects}>Dashboard</a>
      </header>
      <button
        type="button"
        className={styles.contactButton}
        onClick={() => alert("Contact form coming soon.")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/message.svg" alt="Contact" />
      </button>
    </div>
  );
};

export default IssuesPage;
