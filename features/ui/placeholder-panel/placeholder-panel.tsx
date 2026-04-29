import Link from "next/link";
import styles from "./placeholder-panel.module.scss";

type PlaceholderPanelProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryAction?: { label: string; href: string };
};

/**
 * Consistent “coming soon” surface for dashboard routes that are not built yet.
 * Keeps the IA honest (nav stays intact) while signalling intentional backlog.
 */
export function PlaceholderPanel({
  eyebrow = "Coming soon",
  title,
  description,
  primaryAction,
}: PlaceholderPanelProps) {
  return (
    <section
      className={styles.panel}
      aria-labelledby="placeholder-title"
      role="region"
    >
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 id="placeholder-title" className={styles.title}>
        {title}
      </h2>
      <p className={styles.description}>{description}</p>
      {primaryAction && (
        <Link href={primaryAction.href} className={styles.action}>
          {primaryAction.label}
        </Link>
      )}
    </section>
  );
}
