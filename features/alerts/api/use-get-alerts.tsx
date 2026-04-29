import { useQuery } from "@tanstack/react-query";
import { getAlerts } from "@api/alerts";
import type { Alert } from "@api/alerts.types";

const QUERY_KEY = "alerts";

export function getAlertsQueryKey() {
  return [QUERY_KEY] as const;
}

export function useGetAlerts() {
  return useQuery<Alert[], Error>(getAlertsQueryKey(), ({ signal }) =>
    getAlerts({ signal }),
  );
}
