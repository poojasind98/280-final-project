import Link from "next/link";
import classNames from "classnames";
import { Routes } from "@config/routes";
import styles from "./brand-logo.module.scss";

type BrandLogoProps = {
  /** When false, show only the star mark (collapsed sidebar). */
  showWordmark?: boolean;
  /** Smaller star for collapsed rail */
  compact?: boolean;
  className?: string;
};

/**
 * ErrSense wordmark as HTML + star graphic — avoids unreliable SVG text rendering.
 */
export function BrandLogo({
  showWordmark = true,
  compact = false,
  className,
}: BrandLogoProps) {
  return (
    <Link
      href={Routes.projects}
      className={classNames(styles.wrap, compact && styles.compact, className)}
      aria-label="ErrSense — go to dashboard"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/logo-small.svg"
        alt=""
        width={33}
        height={33}
        className={styles.mark}
      />
      {showWordmark && (
        <span className={styles.wordmark} aria-hidden="true">
          <span className={styles.err}>Err</span>
          <span className={styles.sense}>Sense</span>
        </span>
      )}
    </Link>
  );
}
