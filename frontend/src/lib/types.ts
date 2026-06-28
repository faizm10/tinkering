export type TrendPoint = {
  day: string;
  users: number;
  sessions: number;
  pageviews?: number;
  events: number;
};

export type RepositorySummary = {
  id: string;
  slug: string;
  fullName: string;
  private: boolean;
  activeUsers: number;
  sessions: number;
  pageviews?: number;
  events: number;
  change: number;
  status: "live" | "setup";
  analyticsSource?: "native" | "google-analytics";
  lastEventAt?: string | null;
};

export type ProductUserSummary = {
  id: string;
  displayId: string;
  traits: Record<string, unknown>;
  firstSeenAt: string;
  lastSeenAt: string;
  sessions: number;
  events: number;
};

export type EventSummary = {
  id: string;
  name: string;
  displayId: string;
  occurredAt: string;
  path: string | null;
  properties: Record<string, unknown>;
};
