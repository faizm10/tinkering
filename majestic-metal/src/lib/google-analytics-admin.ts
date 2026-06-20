import { and, eq, gte, sql } from "drizzle-orm";
import { getDatabase, hasDatabase } from "@/db";
import {
  analyticsProjects,
  googleAnalyticsConnections,
  googleAnalyticsDailyMetrics,
  repositories,
} from "@/db/schema";
import { encryptJson } from "./crypto";
import {
  fetchGoogleAnalyticsMetrics,
  syncGoogleAnalyticsConnection,
  type GoogleServiceAccountCredentials,
} from "./google-analytics";
import { findOwnedRepository } from "./project-admin";

export async function getGoogleAnalyticsConnection(
  clerkUserId: string,
  repositorySlug: string,
) {
  if (!hasDatabase()) return null;
  const repository = await findOwnedRepository(clerkUserId, repositorySlug);
  if (!repository?.projectId) return null;
  const db = getDatabase();
  const [connection] = await db
    .select({
      id: googleAnalyticsConnections.id,
      propertyId: googleAnalyticsConnections.propertyId,
      propertyName: googleAnalyticsConnections.propertyName,
      status: googleAnalyticsConnections.status,
      lastSyncedAt: googleAnalyticsConnections.lastSyncedAt,
      lastError: googleAnalyticsConnections.lastError,
    })
    .from(googleAnalyticsConnections)
    .where(eq(googleAnalyticsConnections.projectId, repository.projectId))
    .limit(1);
  return connection ?? null;
}

export async function connectGoogleAnalytics({
  clerkUserId,
  repositorySlug,
  propertyId,
  propertyName,
  credentials,
}: {
  clerkUserId: string;
  repositorySlug: string;
  propertyId: string;
  propertyName?: string;
  credentials: GoogleServiceAccountCredentials;
}) {
  if (!hasDatabase()) {
    return {
      id: "demo-google-analytics",
      propertyId,
      propertyName: propertyName ?? "Demo GA4 property",
      status: "connected",
      lastSyncedAt: new Date(),
      lastError: null,
    };
  }

  const repository = await findOwnedRepository(clerkUserId, repositorySlug);
  if (!repository?.projectId) throw new Error("analytics_project_not_found");

  await fetchGoogleAnalyticsMetrics({
    credentials,
    propertyId,
    startDate: "yesterday",
    endDate: "today",
  });

  const db = getDatabase();
  const [connection] = await db
    .insert(googleAnalyticsConnections)
    .values({
      projectId: repository.projectId,
      propertyId: propertyId.replace(/^properties\//, ""),
      propertyName,
      encryptedCredentials: encryptJson(credentials),
      status: "pending",
    })
    .onConflictDoUpdate({
      target: googleAnalyticsConnections.projectId,
      set: {
        propertyId: propertyId.replace(/^properties\//, ""),
        propertyName,
        encryptedCredentials: encryptJson(credentials),
        status: "pending",
        lastError: null,
        updatedAt: new Date(),
      },
    })
    .returning({ id: googleAnalyticsConnections.id });

  await syncGoogleAnalyticsConnection(connection.id);
  return getGoogleAnalyticsConnection(clerkUserId, repositorySlug);
}

export async function disconnectGoogleAnalytics(
  clerkUserId: string,
  repositorySlug: string,
) {
  if (!hasDatabase()) return;
  const repository = await findOwnedRepository(clerkUserId, repositorySlug);
  if (!repository?.projectId) throw new Error("analytics_project_not_found");
  const db = getDatabase();
  await db
    .delete(googleAnalyticsConnections)
    .where(eq(googleAnalyticsConnections.projectId, repository.projectId));
}

export async function getGoogleAnalyticsMetricsForRepository(repositorySlug: string) {
  if (!hasDatabase()) return null;
  const db = getDatabase();
  const rows = await db
    .select({
      day: googleAnalyticsDailyMetrics.day,
      activeUsers: googleAnalyticsDailyMetrics.activeUsers,
      sessions: googleAnalyticsDailyMetrics.sessions,
      pageviews: googleAnalyticsDailyMetrics.pageviews,
      events: googleAnalyticsDailyMetrics.events,
      eventBreakdown: googleAnalyticsDailyMetrics.eventBreakdown,
      referrerBreakdown: googleAnalyticsDailyMetrics.referrerBreakdown,
    })
    .from(googleAnalyticsDailyMetrics)
    .innerJoin(
      googleAnalyticsConnections,
      eq(googleAnalyticsConnections.id, googleAnalyticsDailyMetrics.connectionId),
    )
    .innerJoin(
      analyticsProjects,
      eq(analyticsProjects.id, googleAnalyticsConnections.projectId),
    )
    .innerJoin(
      repositories,
      eq(repositories.id, analyticsProjects.repositoryId),
    )
    .where(
      and(
        eq(repositories.name, repositorySlug),
        eq(googleAnalyticsConnections.status, "connected"),
        gte(googleAnalyticsDailyMetrics.day, sql`current_date - interval '30 days'`),
      ),
    )
    .orderBy(googleAnalyticsDailyMetrics.day);
  return rows.length ? rows : null;
}
