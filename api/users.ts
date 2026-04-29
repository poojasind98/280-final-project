import type { TeamMember } from "./users.types";
import { UserMembershipStatus, UserRole } from "./users.types";

const DEMO_PROJECT_IDS = {
  frontend: "6d5fff43-d691-445d-a41a-7d0c639080e6",
  backend: "340cb147-6397-4a12-aa77-41100acf085f",
  ml: "9aa6a101-2c92-4797-b497-b31b2cb4c94b",
} as const;

function buildDemoTeam(): TeamMember[] {
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

  return [
    {
      id: "usr-01",
      name: "Alex Rivera",
      email: "alex.rivera@example.com",
      role: UserRole.admin,
      status: UserMembershipStatus.active,
      projectIds: [
        DEMO_PROJECT_IDS.frontend,
        DEMO_PROJECT_IDS.backend,
        DEMO_PROJECT_IDS.ml,
      ],
      lastActiveAt: iso(20 * 60 * 1000),
    },
    {
      id: "usr-02",
      name: "Jordan Kim",
      email: "jordan.kim@example.com",
      role: UserRole.member,
      status: UserMembershipStatus.active,
      projectIds: [DEMO_PROJECT_IDS.frontend, DEMO_PROJECT_IDS.backend],
      lastActiveAt: iso(3 * 60 * 60 * 1000),
    },
    {
      id: "usr-03",
      name: "Sam Patel",
      email: "sam.patel@example.com",
      role: UserRole.member,
      status: UserMembershipStatus.invited,
      projectIds: [DEMO_PROJECT_IDS.backend],
      lastActiveAt: null,
    },
    {
      id: "usr-04",
      name: "Riley Chen",
      email: "riley.chen@example.com",
      role: UserRole.viewer,
      status: UserMembershipStatus.active,
      projectIds: [DEMO_PROJECT_IDS.ml],
      lastActiveAt: iso(5 * 24 * 60 * 60 * 1000),
    },
    {
      id: "usr-05",
      name: "Morgan Blake",
      email: "morgan.blake@example.com",
      role: UserRole.admin,
      status: UserMembershipStatus.active,
      projectIds: [],
      lastActiveAt: iso(45 * 60 * 1000),
    },
    {
      id: "usr-06",
      name: "Casey Nguyen",
      email: "casey.nguyen@example.com",
      role: UserRole.viewer,
      status: UserMembershipStatus.suspended,
      projectIds: [DEMO_PROJECT_IDS.frontend],
      lastActiveAt: iso(18 * 24 * 60 * 60 * 1000),
    },
  ];
}

export async function getTeamMembers(options?: { signal?: AbortSignal }) {
  if (options?.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  return buildDemoTeam();
}
