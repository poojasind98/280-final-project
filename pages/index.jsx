import { Routes } from "@config/routes";
import styles from "./index.module.scss";

const IssuesPage = () => {
  return (
    <div>
      <header className={styles.header}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/logo-large.svg" alt="ErrSense logo" />
        <a href={Routes.projects}>Dashboard</a>
      </header>
      <button
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
