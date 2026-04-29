export enum UserRole {
  admin = "admin",
  member = "member",
  viewer = "viewer",
}

export enum UserMembershipStatus {
  active = "active",
  invited = "invited",
  suspended = "suspended",
}

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserMembershipStatus;
  /** Projects this user can access; empty means org-wide (demo). */
  projectIds: string[];
  lastActiveAt: string | null;
};
