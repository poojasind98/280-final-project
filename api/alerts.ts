import type { Alert } from "./alerts.types";
import { AlertChannel, AlertState } from "./alerts.types";

/** Demo IDs aligned with remote mock projects when available; names resolve via Projects API. */
const DEMO_PROJECT_IDS = {
  frontend: "6d5fff43-d691-445d-a41a-7d0c639080e6",
  backend: "340cb147-6397-4a12-aa77-41100acf085f",
  ml: "9aa6a101-2c92-4797-b497-b31b2cb4c94b",
} as const;

function buildDemoAlerts(): Alert[] {
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

  return [
    {
      id: "alt-checkout-spike",
      projectId: DEMO_PROJECT_IDS.frontend,
      name: "Checkout error spike",
      condition: "≥ 50 errors/min sustained for 5 minutes",
      channel: AlertChannel.slack,
      state: AlertState.firing,
      lastTriggeredAt: iso(12 * 60 * 1000),
      notifications24h: 14,
    },
    {
      id: "alt-api-latency",
      projectId: DEMO_PROJECT_IDS.backend,
      name: "API p95 latency",
      condition: "p95 > 800ms for 10 minutes",
      channel: AlertChannel.pagerduty,
      state: AlertState.ok,
      lastTriggeredAt: iso(26 * 60 * 60 * 1000),
      notifications24h: 0,
    },
    {
      id: "alt-model-drift",
      projectId: DEMO_PROJECT_IDS.ml,
      name: "Inference failure rate",
      condition: "> 2% of requests failing over 15 minutes",
      channel: AlertChannel.email,
      state: AlertState.muted,
      lastTriggeredAt: iso(9 * 24 * 60 * 60 * 1000),
      notifications24h: 0,
    },
    {
      id: "alt-payment-webhook",
      projectId: DEMO_PROJECT_IDS.backend,
      name: "Payment webhook timeouts",
      condition: "≥ 10 timeout events in 5 minutes",
      channel: AlertChannel.slack,
      state: AlertState.firing,
      lastTriggeredAt: iso(45 * 60 * 1000),
      notifications24h: 6,
    },
    {
      id: "alt-build-failure",
      projectId: DEMO_PROJECT_IDS.frontend,
      name: "Release pipeline failure",
      condition: "Any failed deploy stage",
      channel: AlertChannel.slack,
      state: AlertState.ok,
      lastTriggeredAt: iso(5 * 24 * 60 * 60 * 1000),
      notifications24h: 1,
    },
    {
      id: "alt-queue-depth",
      projectId: DEMO_PROJECT_IDS.backend,
      name: "Job queue backlog",
      condition: "Pending jobs > 2,000 for 20 minutes",
      channel: AlertChannel.email,
      state: AlertState.ok,
      lastTriggeredAt: null,
      notifications24h: 0,
    },
  ];
}

export async function getAlerts(options?: { signal?: AbortSignal }) {
  if (options?.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  return buildDemoAlerts();
}
