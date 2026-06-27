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

const now = Date.now();
const hoursAgo = (hours: number) => new Date(now - hours * 3_600_000).toISOString();
const daysAgo = (days: number) => new Date(now - days * 86_400_000).toISOString();

export const demoRepositories: RepositorySummary[] = [
  {
    id: "repo_aurora",
    slug: "aurora",
    fullName: "faizm10/aurora",
    private: false,
    activeUsers: 1842,
    sessions: 3210,
    events: 18430,
    change: 18.4,
    status: "live",
    lastEventAt: hoursAgo(0.2),
  },
  {
    id: "repo_shipkit",
    slug: "shipkit",
    fullName: "faizm10/shipkit",
    private: false,
    activeUsers: 672,
    sessions: 1089,
    events: 6541,
    change: 8.1,
    status: "live",
    lastEventAt: hoursAgo(1.1),
  },
  {
    id: "repo_lens",
    slug: "lens",
    fullName: "northstar-labs/lens",
    private: true,
    activeUsers: 294,
    sessions: 512,
    events: 2821,
    change: -2.3,
    status: "live",
    lastEventAt: hoursAgo(3.8),
  },
  {
    id: "repo_launchpad",
    slug: "launchpad",
    fullName: "northstar-labs/launchpad",
    private: true,
    activeUsers: 0,
    sessions: 0,
    events: 0,
    change: 0,
    status: "setup",
  },
];

export const demoTrend: TrendPoint[] = [
  { day: "May 22", users: 1090, sessions: 1740, events: 7900 },
  { day: "May 26", users: 1180, sessions: 1910, events: 8500 },
  { day: "May 30", users: 1240, sessions: 2050, events: 9780 },
  { day: "Jun 3", users: 1390, sessions: 2310, events: 11200 },
  { day: "Jun 7", users: 1470, sessions: 2460, events: 12880 },
  { day: "Jun 11", users: 1640, sessions: 2780, events: 14900 },
  { day: "Jun 15", users: 1760, sessions: 3020, events: 16940 },
  { day: "Jun 19", users: 1842, sessions: 3210, events: 18430 },
];

export const demoUsers: ProductUserSummary[] = [
  {
    id: "usr_01",
    displayId: "user_8f41",
    traits: { plan: "pro", company: "Northstar" },
    firstSeenAt: daysAgo(46),
    lastSeenAt: hoursAgo(0.2),
    sessions: 38,
    events: 312,
  },
  {
    id: "usr_02",
    displayId: "user_77a2",
    traits: { plan: "free", locale: "en-CA" },
    firstSeenAt: daysAgo(18),
    lastSeenAt: hoursAgo(1.4),
    sessions: 16,
    events: 141,
  },
  {
    id: "usr_03",
    displayId: "user_219c",
    traits: { plan: "team", company: "Paperplane" },
    firstSeenAt: daysAgo(63),
    lastSeenAt: hoursAgo(3.1),
    sessions: 52,
    events: 489,
  },
  {
    id: "usr_04",
    displayId: "anon_a4d9",
    traits: {},
    firstSeenAt: daysAgo(1),
    lastSeenAt: hoursAgo(4.8),
    sessions: 2,
    events: 11,
  },
  {
    id: "usr_05",
    displayId: "user_c018",
    traits: { plan: "pro", locale: "de-DE" },
    firstSeenAt: daysAgo(31),
    lastSeenAt: hoursAgo(7.2),
    sessions: 27,
    events: 233,
  },
  {
    id: "usr_06",
    displayId: "user_5bc1",
    traits: { plan: "free" },
    firstSeenAt: daysAgo(8),
    lastSeenAt: hoursAgo(10.5),
    sessions: 9,
    events: 72,
  },
];

export const demoEvents: EventSummary[] = [
  {
    id: "evt_01",
    name: "project_created",
    displayId: "user_8f41",
    occurredAt: hoursAgo(0.2),
    path: "/projects/new",
    properties: { template: "nextjs", source: "dashboard" },
  },
  {
    id: "evt_02",
    name: "$pageview",
    displayId: "user_77a2",
    occurredAt: hoursAgo(0.6),
    path: "/docs/quickstart",
    properties: { title: "Quickstart" },
  },
  {
    id: "evt_03",
    name: "invite_sent",
    displayId: "user_219c",
    occurredAt: hoursAgo(1.1),
    path: "/settings/team",
    properties: { role: "member" },
  },
  {
    id: "evt_04",
    name: "export_completed",
    displayId: "user_8f41",
    occurredAt: hoursAgo(2.3),
    path: "/reports",
    properties: { format: "csv", rows: 1240 },
  },
  {
    id: "evt_05",
    name: "signup_completed",
    displayId: "user_c018",
    occurredAt: hoursAgo(3.8),
    path: "/welcome",
    properties: { method: "github" },
  },
  {
    id: "evt_06",
    name: "$pageview",
    displayId: "anon_a4d9",
    occurredAt: hoursAgo(4.8),
    path: "/pricing",
    properties: { title: "Pricing" },
  },
  {
    id: "evt_07",
    name: "upgrade_started",
    displayId: "user_5bc1",
    occurredAt: hoursAgo(10.5),
    path: "/settings/billing",
    properties: { from: "free", to: "pro" },
  },
];

export const demoTopEvents = [
  { name: "$pageview", count: 10284, share: 56 },
  { name: "project_created", count: 2134, share: 12 },
  { name: "export_completed", count: 1872, share: 10 },
  { name: "invite_sent", count: 1394, share: 8 },
  { name: "signup_completed", count: 1108, share: 6 },
];

export const demoReferrers = [
  { name: "Direct", count: 1180 },
  { name: "github.com", count: 421 },
  { name: "google.com", count: 186 },
  { name: "vercel.com", count: 55 },
];

export function isDemoSetupRepository(slug: string): boolean {
  return demoRepositories.find((repository) => repository.slug === slug)?.status === "setup";
}
