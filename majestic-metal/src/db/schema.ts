import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const dashboardAccounts = pgTable(
  "dashboard_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: varchar("clerk_user_id", { length: 128 }).notNull(),
    githubLogin: varchar("github_login", { length: 255 }),
    ...timestamps,
  },
  (table) => [uniqueIndex("accounts_clerk_user_idx").on(table.clerkUserId)],
);

export const githubInstallations = pgTable(
  "github_installations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => dashboardAccounts.id, { onDelete: "cascade" }),
    installationId: bigint("installation_id", { mode: "number" }).notNull(),
    githubAccountId: bigint("github_account_id", { mode: "number" }).notNull(),
    githubLogin: varchar("github_login", { length: 255 }).notNull(),
    accountType: varchar("account_type", { length: 32 }).notNull(),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("github_installation_id_idx").on(table.installationId),
    index("github_installation_account_idx").on(table.accountId),
  ],
);

export const repositories = pgTable(
  "repositories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    installationId: uuid("installation_id")
      .notNull()
      .references(() => githubInstallations.id, { onDelete: "cascade" }),
    githubRepositoryId: bigint("github_repository_id", { mode: "number" }).notNull(),
    owner: varchar("owner", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 512 }).notNull(),
    defaultBranch: varchar("default_branch", { length: 255 }),
    private: boolean("private").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    selected: boolean("selected").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("repositories_github_id_idx").on(table.githubRepositoryId),
    index("repositories_installation_idx").on(table.installationId),
  ],
);

export const analyticsProjects = pgTable(
  "analytics_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    allowedOrigins: text("allowed_origins").array().notNull().default([]),
    retentionDays: integer("retention_days").notNull().default(90),
    ...timestamps,
  },
  (table) => [uniqueIndex("analytics_project_repository_idx").on(table.repositoryId)],
);

export const trackingKeys = pgTable(
  "tracking_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => analyticsProjects.id, { onDelete: "cascade" }),
    prefix: varchar("prefix", { length: 32 }).notNull(),
    keyHash: varchar("key_hash", { length: 128 }).notNull(),
    kind: varchar("kind", { length: 16 }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("tracking_key_hash_idx").on(table.keyHash),
    index("tracking_key_project_idx").on(table.projectId),
  ],
);

export const visitors = pgTable(
  "visitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => analyticsProjects.id, { onDelete: "cascade" }),
    anonymousIdHash: varchar("anonymous_id_hash", { length: 128 }).notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("visitors_project_anon_idx").on(table.projectId, table.anonymousIdHash),
    index("visitors_project_last_seen_idx").on(table.projectId, table.lastSeenAt),
  ],
);

export const productUsers = pgTable(
  "product_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => analyticsProjects.id, { onDelete: "cascade" }),
    externalIdHash: varchar("external_id_hash", { length: 128 }).notNull(),
    displayId: varchar("display_id", { length: 255 }).notNull(),
    traits: jsonb("traits").$type<Record<string, unknown>>().notNull().default({}),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("product_users_project_external_idx").on(table.projectId, table.externalIdHash),
    index("product_users_project_last_seen_idx").on(table.projectId, table.lastSeenAt),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => analyticsProjects.id, { onDelete: "cascade" }),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, { onDelete: "cascade" }),
    productUserId: uuid("product_user_id").references(() => productUsers.id, {
      onDelete: "set null",
    }),
    clientSessionId: varchar("client_session_id", { length: 128 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
    referrer: text("referrer"),
    landingPath: text("landing_path"),
    utm: jsonb("utm").$type<Record<string, string>>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sessions_project_client_idx").on(table.projectId, table.clientSessionId),
    index("sessions_project_started_idx").on(table.projectId, table.startedAt),
    index("sessions_user_idx").on(table.productUserId),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").notNull().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => analyticsProjects.id, { onDelete: "cascade" }),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, { onDelete: "cascade" }),
    productUserId: uuid("product_user_id").references(() => productUsers.id, {
      onDelete: "set null",
    }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    clientEventId: varchar("client_event_id", { length: 128 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    path: text("path"),
    referrer: text("referrer"),
    properties: jsonb("properties").$type<Record<string, unknown>>().notNull().default({}),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.id, table.occurredAt], name: "events_id_occurred_at_pk" }),
    uniqueIndex("events_project_client_event_idx").on(
      table.projectId,
      table.clientEventId,
      table.occurredAt,
    ),
    index("events_project_occurred_idx").on(table.projectId, table.occurredAt),
    index("events_project_name_idx").on(table.projectId, table.name),
    index("events_user_occurred_idx").on(table.productUserId, table.occurredAt),
    index("events_session_idx").on(table.sessionId),
  ],
);

export const dailyAggregates = pgTable(
  "daily_aggregates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => analyticsProjects.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    activeVisitors: integer("active_visitors").notNull().default(0),
    identifiedUsers: integer("identified_users").notNull().default(0),
    sessions: integer("sessions").notNull().default(0),
    pageviews: integer("pageviews").notNull().default(0),
    events: integer("events").notNull().default(0),
    eventBreakdown: jsonb("event_breakdown")
      .$type<Record<string, number>>()
      .notNull()
      .default({}),
    referrerBreakdown: jsonb("referrer_breakdown")
      .$type<Record<string, number>>()
      .notNull()
      .default({}),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("daily_aggregates_project_day_idx").on(table.projectId, table.day),
  ],
);

export const ingestionBatches = pgTable(
  "ingestion_batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => analyticsProjects.id, { onDelete: "cascade" }),
    idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
    acceptedEvents: integer("accepted_events").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ingestion_batches_project_key_idx").on(
      table.projectId,
      table.idempotencyKey,
    ),
  ],
);

export const googleAnalyticsConnections = pgTable(
  "google_analytics_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => analyticsProjects.id, { onDelete: "cascade" }),
    propertyId: varchar("property_id", { length: 64 }).notNull(),
    propertyName: varchar("property_name", { length: 255 }),
    encryptedCredentials: text("encrypted_credentials").notNull(),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    lastError: text("last_error"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("google_analytics_project_idx").on(table.projectId),
    index("google_analytics_property_idx").on(table.propertyId),
  ],
);

export const googleAnalyticsDailyMetrics = pgTable(
  "google_analytics_daily_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => googleAnalyticsConnections.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => analyticsProjects.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    activeUsers: integer("active_users").notNull().default(0),
    sessions: integer("sessions").notNull().default(0),
    pageviews: integer("pageviews").notNull().default(0),
    events: integer("events").notNull().default(0),
    eventBreakdown: jsonb("event_breakdown")
      .$type<Record<string, number>>()
      .notNull()
      .default({}),
    referrerBreakdown: jsonb("referrer_breakdown")
      .$type<Record<string, number>>()
      .notNull()
      .default({}),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("google_analytics_daily_connection_day_idx").on(table.connectionId, table.day),
    index("google_analytics_daily_project_day_idx").on(table.projectId, table.day),
  ],
);

export const googleAnalyticsSyncRuns = pgTable(
  "google_analytics_sync_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => googleAnalyticsConnections.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 32 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    recordsProcessed: integer("records_processed").notNull().default(0),
    error: text("error"),
    ...timestamps,
  },
  (table) => [
    index("google_analytics_sync_runs_connection_idx").on(table.connectionId, table.startedAt),
  ],
);
