import { useMemo, useState } from "react";
import classNames from "classnames";
import { UserMembershipStatus, UserRole } from "@api/users.types";
import { useGetProjects } from "@features/projects";
import { SkeletonPulse } from "@features/ui";
import { useGetTeamMembers } from "../../api/use-get-team-members";
import { UserRow } from "./user-row";
import styles from "./user-list.module.scss";

type RoleFilter = "all" | UserRole;
type StatusFilter = "all" | UserMembershipStatus;

const ROLE_OPTIONS: { id: RoleFilter; label: string }[] = [
  { id: "all", label: "All roles" },
  { id: UserRole.admin, label: "Admin" },
  { id: UserRole.member, label: "Member" },
  { id: UserRole.viewer, label: "Viewer" },
];

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All statuses" },
  { id: UserMembershipStatus.active, label: "Active" },
  { id: UserMembershipStatus.invited, label: "Invited" },
  { id: UserMembershipStatus.suspended, label: "Suspended" },
];

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const sec = Math.round((Date.now() - then) / 1000);
  if (sec < 0) return "just now";

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (sec < 45) return rtf.format(-Math.max(sec, 1), "second");
  const min = Math.round(sec / 60);
  if (min < 60) return rtf.format(-min, "minute");
  const hr = Math.round(min / 60);
  if (hr < 48) return rtf.format(-hr, "hour");
  const day = Math.round(hr / 24);
  if (day < 14) return rtf.format(-day, "day");
  const week = Math.round(day / 7);
  if (week < 8) return rtf.format(-week, "week");
  const month = Math.round(day / 30);
  return rtf.format(-Math.max(month, 1), "month");
}

function UserTableSkeleton() {
  return (
    <div
      className={styles.container}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading team members"
    >
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            <th className={styles.headerCell}>Member</th>
            <th className={styles.headerCell}>Role</th>
            <th className={styles.headerCell}>Status</th>
            <th className={styles.headerCell}>Projects</th>
            <th className={styles.headerCell}>Last active</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className={styles.skeletonRow}>
              <td>
                <div className={styles.skeletonMemberCell}>
                  <SkeletonPulse
                    width="2.375rem"
                    height="2.375rem"
                    rounded="full"
                  />
                  <div className={styles.skeletonGrow}>
                    <SkeletonPulse height="0.875rem" width="52%" rounded="sm" />
                    <SkeletonPulse height="0.75rem" width="78%" rounded="sm" />
                  </div>
                </div>
              </td>
              <td>
                <SkeletonPulse height="1.5rem" width="4.25rem" rounded="full" />
              </td>
              <td>
                <SkeletonPulse height="1.5rem" width="4.5rem" rounded="full" />
              </td>
              <td>
                <SkeletonPulse height="1rem" width="7rem" rounded="sm" />
              </td>
              <td>
                <SkeletonPulse height="1rem" width="5rem" rounded="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatProjectsLabel(
  projectIds: string[],
  idToName: Map<string, string>,
): string {
  if (projectIds.length === 0) return "All projects";
  const names = projectIds.map((id) => idToName.get(id) ?? id.slice(0, 8));
  return names.join(", ");
}

export function UserList() {
  const membersQuery = useGetTeamMembers();
  const projects = useGetProjects();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const idToName = useMemo(() => {
    const map = new Map<string, string>();
    (projects.data || []).forEach((p) => map.set(p.id, p.name));
    return map;
  }, [projects.data]);

  const filteredMembers = useMemo(() => {
    const items = membersQuery.data || [];
    return items.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      return true;
    });
  }, [membersQuery.data, roleFilter, statusFilter]);

  if (projects.isLoading || membersQuery.isLoading) {
    return (
      <>
        <div className={styles.toolbarSection}>
          <span className={styles.toolbarLabel}>Role</span>
          <div
            className={styles.toolbar}
            role="group"
            aria-label="Filter by role"
          >
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={styles.filterButton}
                disabled
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.toolbarSection}>
          <span className={styles.toolbarLabel}>Status</span>
          <div
            className={styles.toolbar}
            role="group"
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={styles.filterButton}
                disabled
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <UserTableSkeleton />
      </>
    );
  }

  if (projects.isError) {
    console.error(projects.error);
    return (
      <div className={styles.errorBox} role="alert">
        <strong>Couldn’t load projects.</strong> {projects.error.message}
      </div>
    );
  }

  if (membersQuery.isError) {
    console.error(membersQuery.error);
    return (
      <div className={styles.errorBox} role="alert">
        <strong>Couldn’t load team members.</strong>{" "}
        {membersQuery.error.message}
      </div>
    );
  }

  const total = membersQuery.data?.length ?? 0;
  const isFiltering =
    (roleFilter !== "all" || statusFilter !== "all") &&
    filteredMembers.length !== total;

  return (
    <>
      <div className={styles.toolbarSection}>
        <span className={styles.toolbarLabel} id="users-role-filter-label">
          Role
        </span>
        <div
          className={styles.toolbar}
          role="group"
          aria-labelledby="users-role-filter-label"
        >
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={classNames(
                styles.filterButton,
                roleFilter === opt.id && styles.filterButtonActive,
              )}
              aria-pressed={roleFilter === opt.id}
              onClick={() => setRoleFilter(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.toolbarSection}>
        <span className={styles.toolbarLabel} id="users-status-filter-label">
          Status
        </span>
        <div
          className={styles.toolbar}
          role="group"
          aria-labelledby="users-status-filter-label"
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={classNames(
                styles.filterButton,
                statusFilter === opt.id && styles.filterButtonActive,
              )}
              aria-pressed={statusFilter === opt.id}
              onClick={() => setStatusFilter(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.container}>
        {isFiltering && (
          <div className={styles.filterStatus} aria-live="polite">
            Showing {filteredMembers.length} of {total} members.
          </div>
        )}
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.headerCell}>Member</th>
              <th className={styles.headerCell}>Role</th>
              <th className={styles.headerCell}>Status</th>
              <th className={styles.headerCell}>Projects</th>
              <th className={styles.headerCell}>Last active</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <UserRow
                key={member.id}
                member={member}
                projectsLabel={formatProjectsLabel(member.projectIds, idToName)}
                relativeLastActive={formatRelative(member.lastActiveAt)}
              />
            ))}
          </tbody>
        </table>
        {filteredMembers.length === 0 && (
          <div className={styles.emptyState} role="status">
            No team members match these filters.
          </div>
        )}
      </div>

      <p className={styles.footnote}>
        Directory shown is demo data. Production ErrSense would sync SSO,
        invitations, and audit trails from your identity provider.
      </p>
    </>
  );
}
