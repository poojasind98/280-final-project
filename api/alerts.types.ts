export enum AlertChannel {
  slack = "slack",
  email = "email",
  pagerduty = "pagerduty",
}

export enum AlertState {
  ok = "ok",
  firing = "firing",
  muted = "muted",
}

export type Alert = {
  id: string;
  projectId: string;
  name: string;
  condition: string;
  channel: AlertChannel;
  state: AlertState;
  /** ISO timestamp of last notification sent, or null if never fired */
  lastTriggeredAt: string | null;
  notifications24h: number;
};
