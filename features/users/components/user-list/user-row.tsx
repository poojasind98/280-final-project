import capitalize from "lodash/capitalize";
import { Badge, BadgeColor, BadgeSize } from "@features/ui";
import { UserMembershipStatus, UserRole } from "@api/users.types";
import type { TeamMember } from "@api/users.types";
import styles from "./user-row.module.scss";

type UserRowProps = {
  member: TeamMember;
  projectsLabel: string;
  relativeLastActive: string;
};

const roleColors: Record<UserRole, BadgeColor> = {
  [UserRole.admin]: BadgeColor.primary,
  [UserRole.member]: BadgeColor.warning,
  [UserRole.viewer]: BadgeColor.gray,
};

const statusColors: Record<UserMembershipStatus, BadgeColor> = {
  [UserMembershipStatus.active]: BadgeColor.success,
  [UserMembershipStatus.invited]: BadgeColor.warning,
  [UserMembershipStatus.suspended]: BadgeColor.error,
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1];
  return `${a}${b ?? ""}`.toUpperCase();
}

export function UserRow({
  member,
  projectsLabel,
  relativeLastActive,
}: UserRowProps) {
  const { name, email, role, status } = member;

  return (
    <tr className={styles.row}>
      <td className={styles.memberCell}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(name)}
        </span>
        <div className={styles.memberText}>
          <div className={styles.displayName}>{name}</div>
          <a
            href={`mailto:${encodeURIComponent(email)}`}
            className={styles.email}
          >
            {email}
          </a>
        </div>
      </td>
      <td className={styles.cell}>
        <Badge color={roleColors[role]} size={BadgeSize.sm}>
          {capitalize(role)}
        </Badge>
      </td>
      <td className={styles.cell}>
        <Badge color={statusColors[status]} size={BadgeSize.sm}>
          {capitalize(status)}
        </Badge>
      </td>
      <td className={styles.projectsCell}>{projectsLabel}</td>
      <td className={styles.cellMono}>{relativeLastActive}</td>
    </tr>
  );
}
