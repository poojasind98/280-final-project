import Head from "next/head";
import { SidebarNavigation } from "../sidebar-navigation";
import styles from "./page-container.module.scss";

type PageContainerProps = {
  children: React.ReactNode;
  title: string;
  info: string;
  /** Overrides default `<meta name="description">` for SEO / sharing context */
  metaDescription?: string;
};

export function PageContainer({
  children,
  title,
  info,
  metaDescription,
}: PageContainerProps) {
  const documentTitle = `ErrSense - ${title}`;
  const description =
    metaDescription ??
    `${title} — ErrSense production error monitoring with AI-assisted triage.`;

  return (
    <div className={styles.container}>
      <Head>
        <title>{documentTitle}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>
      <SidebarNavigation />
      <main id="main-content" className={styles.main} tabIndex={-1}>
        <div className={styles.contentContainer}>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.info}>{info}</div>
          {children}
        </div>
      </main>
    </div>
  );
}
