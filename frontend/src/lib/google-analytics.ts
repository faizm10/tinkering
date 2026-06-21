import { GoogleAuth } from "google-auth-library";
import { eq } from "drizzle-orm";
import { getDatabase, hasDatabase } from "@/db";
import {
  googleAnalyticsConnections,
  googleAnalyticsDailyMetrics,
  googleAnalyticsSyncRuns,
} from "@/db/schema";
import { decryptJson } from "./crypto";

export type GoogleServiceAccountCredentials = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

export type GoogleAnalyticsReportRow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

type RunReportResponse = {
  rows?: GoogleAnalyticsReportRow[];
};

type DailyMetric = {
  day: string;
  activeUsers: number;
  sessions: number;
  pageviews: number;
  events: number;
  eventBreakdown: Record<string, number>;
  referrerBreakdown: Record<string, number>;
};

function normalizePropertyId(propertyId: string) {
  return propertyId.replace(/^properties\//, "").trim();
}

function parseGaDate(value: string) {
  if (!/^\d{8}$/.test(value)) throw new Error(`Invalid Google Analytics date: ${value}`);
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function numberValue(row: GoogleAnalyticsReportRow, index: number) {
  return Number(row.metricValues?.[index]?.value ?? 0);
}

async function runReport(
  credentials: GoogleServiceAccountCredentials,
  propertyId: string,
  body: Record<string, unknown>,
) {
  const auth = new GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key.replace(/\\n/g, "\n"),
      project_id: credentials.project_id,
    },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const client = await auth.getClient();
  const response = await client.request<RunReportResponse>({
    url: `https://analyticsdata.googleapis.com/v1beta/properties/${normalizePropertyId(propertyId)}:runReport`,
    method: "POST",
    data: body,
  });
  return response.data.rows ?? [];
}

export async function fetchGoogleAnalyticsMetrics({
  credentials,
  propertyId,
  startDate = "30daysAgo",
  endDate = "today",
}: {
  credentials: GoogleServiceAccountCredentials;
  propertyId: string;
  startDate?: string;
  endDate?: string;
}) {
  const dateRanges = [{ startDate, endDate }];
  const [summaryRows, eventRows, referrerRows] = await Promise.all([
    runReport(credentials, propertyId, {
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "eventCount" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: "10000",
    }),
    runReport(credentials, propertyId, {
      dateRanges,
      dimensions: [{ name: "date" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      limit: "100000",
    }),
    runReport(credentials, propertyId, {
      dateRanges,
      dimensions: [{ name: "date" }, { name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      limit: "100000",
    }),
  ]);

  return normalizeGoogleAnalyticsReports({ summaryRows, eventRows, referrerRows });
}

export function normalizeGoogleAnalyticsReports({
  summaryRows,
  eventRows,
  referrerRows,
}: {
  summaryRows: GoogleAnalyticsReportRow[];
  eventRows: GoogleAnalyticsReportRow[];
  referrerRows: GoogleAnalyticsReportRow[];
}) {
  const metrics = new Map<string, DailyMetric>();
  for (const row of summaryRows) {
    const day = parseGaDate(row.dimensionValues?.[0]?.value ?? "");
    metrics.set(day, {
      day,
      activeUsers: numberValue(row, 0),
      sessions: numberValue(row, 1),
      pageviews: numberValue(row, 2),
      events: numberValue(row, 3),
      eventBreakdown: {},
      referrerBreakdown: {},
    });
  }

  for (const row of eventRows) {
    const day = parseGaDate(row.dimensionValues?.[0]?.value ?? "");
    const eventName = row.dimensionValues?.[1]?.value ?? "(unknown)";
    const metric = metrics.get(day);
    if (metric) metric.eventBreakdown[eventName] = numberValue(row, 0);
  }

  for (const row of referrerRows) {
    const day = parseGaDate(row.dimensionValues?.[0]?.value ?? "");
    const source = row.dimensionValues?.[1]?.value || "(direct)";
    const metric = metrics.get(day);
    if (metric) metric.referrerBreakdown[source] = numberValue(row, 0);
  }

  return [...metrics.values()].sort((a, b) => a.day.localeCompare(b.day));
}

export async function syncGoogleAnalyticsConnection(
  connectionId: string,
  dateRange: { startDate?: string; endDate?: string } = {},
) {
  if (!hasDatabase()) return { recordsProcessed: 0 };
  const db = getDatabase();
  const [connection] = await db
    .select()
    .from(googleAnalyticsConnections)
    .where(eq(googleAnalyticsConnections.id, connectionId))
    .limit(1);
  if (!connection) throw new Error("Google Analytics connection not found");

  const [run] = await db
    .insert(googleAnalyticsSyncRuns)
    .values({ connectionId, status: "running" })
    .returning({ id: googleAnalyticsSyncRuns.id });

  try {
    const credentials = decryptJson<GoogleServiceAccountCredentials>(
      connection.encryptedCredentials,
    );
    const rows = await fetchGoogleAnalyticsMetrics({
      credentials,
      propertyId: connection.propertyId,
      ...dateRange,
    });

    await db.transaction(async (tx) => {
      for (const row of rows) {
        await tx
          .insert(googleAnalyticsDailyMetrics)
          .values({
            connectionId,
            projectId: connection.projectId,
            day: row.day,
            activeUsers: row.activeUsers,
            sessions: row.sessions,
            pageviews: row.pageviews,
            events: row.events,
            eventBreakdown: row.eventBreakdown,
            referrerBreakdown: row.referrerBreakdown,
          })
          .onConflictDoUpdate({
            target: [
              googleAnalyticsDailyMetrics.connectionId,
              googleAnalyticsDailyMetrics.day,
            ],
            set: {
              activeUsers: row.activeUsers,
              sessions: row.sessions,
              pageviews: row.pageviews,
              events: row.events,
              eventBreakdown: row.eventBreakdown,
              referrerBreakdown: row.referrerBreakdown,
              updatedAt: new Date(),
            },
          });
      }

      await tx
        .update(googleAnalyticsConnections)
        .set({
          status: "connected",
          lastSyncedAt: new Date(),
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(googleAnalyticsConnections.id, connectionId));
      await tx
        .update(googleAnalyticsSyncRuns)
        .set({
          status: "completed",
          recordsProcessed: rows.length,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(googleAnalyticsSyncRuns.id, run.id));
    });

    return { recordsProcessed: rows.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Analytics sync failed";
    await db
      .update(googleAnalyticsConnections)
      .set({ status: "error", lastError: message, updatedAt: new Date() })
      .where(eq(googleAnalyticsConnections.id, connectionId));
    await db
      .update(googleAnalyticsSyncRuns)
      .set({
        status: "failed",
        error: message,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(googleAnalyticsSyncRuns.id, run.id));
    throw error;
  }
}

export async function syncAllGoogleAnalyticsConnections() {
  if (!hasDatabase()) return [];
  const db = getDatabase();
  const connections = await db
    .select({ id: googleAnalyticsConnections.id })
    .from(googleAnalyticsConnections)
    .where(eq(googleAnalyticsConnections.status, "connected"));

  return Promise.allSettled(
    connections.map(({ id }) =>
      syncGoogleAnalyticsConnection(id, { startDate: "3daysAgo", endDate: "today" }),
    ),
  );
}
