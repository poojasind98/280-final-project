import { useQuery } from "@tanstack/react-query";
import { getTeamMembers } from "@api/users";
import type { TeamMember } from "@api/users.types";

const QUERY_KEY = "team-members";

export function getTeamMembersQueryKey() {
  return [QUERY_KEY] as const;
}

export function useGetTeamMembers() {
  return useQuery<TeamMember[], Error>(getTeamMembersQueryKey(), ({ signal }) =>
    getTeamMembers({ signal }),
  );
}
