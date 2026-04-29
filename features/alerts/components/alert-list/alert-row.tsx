import capitalize from "lodash/capitalize";
import Link from "next/link";
import { Badge, BadgeColor, BadgeSize } from "@features/ui";
import { ProjectLanguage } from "@api/projects.types";
import { AlertChannel, AlertState } from "@api/alerts.types";
import type { Alert } from "@api/alerts.types";
import { Routes } from "@config/routes";
import styles from "./alert-row.module.scss";

type AlertRowProps = {
  alert: Alert;
  projectLanguage: ProjectLanguage | undefined;
  projectName: string;
  relativeLastTriggered: string;
};

const channelColors: Record<AlertChannel, BadgeColor> = {
  [AlertChannel.slack]: BadgeColor.primary,
  [AlertChannel.email]: BadgeColor.gray,
  [AlertChannel.pagerduty]: BadgeColor.warning,
};

const stateColors: Record<AlertState, BadgeColor> = {
  [AlertState.ok]: BadgeColor.success,
  [AlertState.firing]: BadgeColor.error,
  [AlertState.muted]: BadgeColor.gray,
};

export function AlertRow({
  alert,
  projectLanguage,
  projectName,
  relativeLastTriggered,
}: AlertRowProps) {
  const { name, condition, channel, state, notifications24h } = alert;

  return (
    <tr className={styles.row}>
      <td className={styles.ruleCell}>
        {projectLanguage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            className={styles.languageIcon}
            src={`/icons/${projectLanguage}.svg`}
            alt={projectLanguage}
          />
        ) : (
          <span className={styles.languageFallback} aria-hidden />
        )}
        <Link
          href={Routes.issues}
          className={styles.ruleLink}
          aria-label={`${name} — open issues`}
        >
          <div>
            <div className={styles.ruleTitle}>
              <span className={styles.ruleName}>{name}</span>
              <span className={styles.projectDot} aria-hidden>
                ·
              </span>
              <span className={styles.projectName}>{projectName}</span>
            </div>
            <div className={styles.condition}>{condition}</div>
          </div>
        </Link>
      </td>
      <td className={styles.cell}>
        <Badge color={channelColors[channel]} size={BadgeSize.sm}>
          {capitalize(channel)}
        </Badge>
      </td>
      <td className={styles.cell}>
        <Badge color={stateColors[state]} size={BadgeSize.sm}>
          {capitalize(state)}
        </Badge>
      </td>
      <td className={styles.cellMono}>{relativeLastTriggered}</td>
      <td className={styles.cellMono}>{notifications24h}</td>
    </tr>
  );
}
