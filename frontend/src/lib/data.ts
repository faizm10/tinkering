import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDatabase, hasDatabase } from "@/db";
import {
  analyticsProjects,
  events,
  productUsers,
  repositories,
  sessions,
} from "@/db/schema";
import type { EventSummary, ProductUserSummary, RepositorySummary, TrendPoint } from "./types";
import { getGoogleAnalyticsMetricsForRepository } from "./google-analytics-admin";

export type { EventSummary, ProductUserSummary, RepositorySummary, TrendPoint };

export async function getPortfolio(): Promise<RepositorySummary[]> {
  if (!hasDatabase()) return [];

  try {
    const db = getDatabase();
    // Aggregate live from the events table (last 30 days) so freshly ingested
    // SDK data shows immediately, rather than waiting for the daily cron to
    // populate daily_aggregates.
    const rows = await db
      .select({
        id: repositories.id,
        slug: repositories.name,
        fullName: repositories.fullName,
        private: repositories.private,
        projectId: analyticsProjects.id,
        sdkInstalledAt: analyticsProjects.sdkInstalledAt,
        sdkFramework: analyticsProjects.sdkFramework,
        activeUsers: sql<number>`count(distinct ${events.visitorId})::int`,
        sessions: sql<number>`count(distinct ${events.sessionId})::int`,
        pageviews: sql<number>`count(*) filter (where ${events.name} = '$pageview')::int`,
        events: sql<number>`count(${events.id})::int`,
      })
      .from(repositories)
      .leftJoin(analyticsProjects, eq(analyticsProjects.repositoryId, repositories.id))
      .leftJoin(
        events,
        and(
          eq(events.projectId, analyticsProjects.id),
          gte(events.occurredAt, sql`now() - interval '30 days'`),
        ),
      )
      .where(eq(repositories.selected, true))
      .groupBy(repositories.id, analyticsProjects.id)
      .orderBy(desc(sql`count(${events.id})`));

    const lastEventRows = await db
      .select({
        slug: repositories.name,
        lastEventAt: sql<Date | null>`max(${events.occurredAt})`,
      })
      .from(events)
      .innerJoin(analyticsProjects, eq(analyticsProjects.id, events.projectId))
      .innerJoin(repositories, eq(repositories.id, analyticsProjects.repositoryId))
      .where(eq(repositories.selected, true))
      .groupBy(repositories.name);

    const lastEventBySlug = new Map(
      lastEventRows.map((row) => [row.slug, row.lastEventAt?.toISOString() ?? null]),
    );

    return Promise.all(
      rows.map(async (row) => {
        const lastEventAt = lastEventBySlug.get(row.slug) ?? null;
        const googleMetrics = await getGoogleAnalyticsMetricsForRepository(row.slug);
        if (googleMetrics) {
          const totals = googleMetrics.reduce(
            (sum, metric) => ({
              activeUsers: sum.activeUsers + metric.activeUsers,
              sessions: sum.sessions + metric.sessions,
              pageviews: sum.pageviews + metric.pageviews,
              events: sum.events + metric.events,
            }),
            { activeUsers: 0, sessions: 0, pageviews: 0, events: 0 },
          );
          return {
            id: row.id,
            slug: row.slug,
            fullName: row.fullName,
            private: row.private,
            ...totals,
            change: 0,
            status: "live" as const,
            analyticsSource: "google-analytics" as const,
            lastEventAt,
            sdkInstalledAt: row.sdkInstalledAt?.toISOString() ?? null,
            sdkFramework: row.sdkFramework ?? null,
          };
        }

        return {
          id: row.id,
          slug: row.slug,
          fullName: row.fullName,
          private: row.private,
          activeUsers: row.activeUsers,
          sessions: row.sessions,
          pageviews: row.pageviews,
          events: row.events,
          change: 0,
          status: row.projectId ? ("live" as const) : ("setup" as const),
          analyticsSource: "native" as const,
          lastEventAt,
          sdkInstalledAt: row.sdkInstalledAt?.toISOString() ?? null,
          sdkFramework: row.sdkFramework ?? null,
        };
      }),
    );
  } catch (error) {
    console.error("portfolio_query_failed", { error });
    return [];
  }
}

export async function getRepository(slug: string) {
  const portfolio = await getPortfolio();
  return portfolio.find((repository) => repository.slug === slug) ?? null;
}

export async function getSdkInstall(slug: string) {
  if (!hasDatabase()) return null;
  try {
    const db = getDatabase();
    const [row] = await db
      .select({
        installedAt: analyticsProjects.sdkInstalledAt,
        framework: analyticsProjects.sdkFramework,
        appUrl: analyticsProjects.sdkAppUrl,
      })
      .from(analyticsProjects)
      .innerJoin(repositories, eq(repositories.id, analyticsProjects.repositoryId))
      .where(eq(repositories.name, slug))
      .limit(1);
    if (!row?.installedAt) return null;
    return {
      installedAt: row.installedAt.toISOString(),
      framework: row.framework,
      appUrl: row.appUrl,
    };
  } catch (error) {
    console.error("sdk_install_query_failed", { error });
    return null;
  }
}

export async function getTrend(slug: string): Promise<TrendPoint[]> {
  if (!hasDatabase()) return [];

  try {
    const googleMetrics = await getGoogleAnalyticsMetricsForRepository(slug);
    if (googleMetrics) {
      return googleMetrics.map((row) => ({
        day: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
          new Date(`${row.day}T00:00:00Z`),
        ),
        users: row.activeUsers,
        sessions: row.sessions,
        pageviews: row.pageviews,
        events: row.events,
      }));
    }

    const db = getDatabase();
    const dayExpr = sql<string>`(${events.occurredAt} at time zone 'UTC')::date`;
    const rows = await db
      .select({
        day: dayExpr,
        users: sql<number>`count(distinct ${events.visitorId})::int`,
        sessions: sql<number>`count(distinct ${events.sessionId})::int`,
        pageviews: sql<number>`count(*) filter (where ${events.name} = '$pageview')::int`,
        events: sql<number>`count(${events.id})::int`,
      })
      .from(events)
      .innerJoin(analyticsProjects, eq(analyticsProjects.id, events.projectId))
      .innerJoin(repositories, eq(repositories.id, analyticsProjects.repositoryId))
      .where(
        and(
          eq(repositories.name, slug),
          gte(events.occurredAt, sql`now() - interval '30 days'`),
        ),
      )
      .groupBy(dayExpr)
      .orderBy(dayExpr);

    return rows.map((row) => ({
      day: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
        new Date(`${row.day}T00:00:00Z`),
      ),
      users: row.users,
      sessions: row.sessions,
      pageviews: row.pageviews,
      events: row.events,
    }));
  } catch (error) {
    console.error("trend_query_failed", { error });
    return [];
  }
}

export async function getPortfolioTrend(): Promise<TrendPoint[]> {
  if (!hasDatabase()) return [];

  try {
    const db = getDatabase();
    const dayExpr = sql<string>`(${events.occurredAt} at time zone 'UTC')::date`;
    const rows = await db
      .select({
        day: dayExpr,
        users: sql<number>`count(distinct ${events.visitorId})::int`,
        sessions: sql<number>`count(distinct ${events.sessionId})::int`,
        events: sql<number>`count(${events.id})::int`,
      })
      .from(events)
      .innerJoin(analyticsProjects, eq(analyticsProjects.id, events.projectId))
      .innerJoin(repositories, eq(repositories.id, analyticsProjects.repositoryId))
      .where(
        and(
          eq(repositories.selected, true),
          gte(events.occurredAt, sql`now() - interval '30 days'`),
        ),
      )
      .groupBy(dayExpr)
      .orderBy(dayExpr);

    return rows.map((row) => ({
      day: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
        new Date(`${row.day}T00:00:00Z`),
      ),
      users: row.users,
      sessions: row.sessions,
      events: row.events,
    }));
  } catch (error) {
    console.error("portfolio_trend_query_failed", { error });
    return [];
  }
}

export async function getUsers(slug: string): Promise<ProductUserSummary[]> {
  if (!hasDatabase()) return [];

  try {
    const db = getDatabase();
    const rows = await db
      .select({
        id: productUsers.id,
        displayId: productUsers.displayId,
        traits: productUsers.traits,
        firstSeenAt: productUsers.firstSeenAt,
        lastSeenAt: productUsers.lastSeenAt,
        sessionCount: sql<number>`count(distinct ${sessions.id})::int`,
        eventCount: sql<number>`count(distinct ${events.id})::int`,
      })
      .from(productUsers)
      .innerJoin(analyticsProjects, eq(analyticsProjects.id, productUsers.projectId))
      .innerJoin(repositories, eq(repositories.id, analyticsProjects.repositoryId))
      .leftJoin(sessions, eq(sessions.productUserId, productUsers.id))
      .leftJoin(events, eq(events.productUserId, productUsers.id))
      .where(eq(repositories.name, slug))
      .groupBy(productUsers.id)
      .orderBy(desc(productUsers.lastSeenAt))
      .limit(100);

    return rows.map((row) => ({
      id: row.id,
      displayId: row.displayId,
      traits: row.traits,
      firstSeenAt: row.firstSeenAt.toISOString(),
      lastSeenAt: row.lastSeenAt.toISOString(),
      sessions: row.sessionCount,
      events: row.eventCount,
    }));
  } catch (error) {
    console.error("users_query_failed", { error });
    return [];
  }
}

export async function getEvents(slug: string): Promise<EventSummary[]> {
  if (!hasDatabase()) return [];

  try {
    const db = getDatabase();
    const rows = await db
      .select({
        id: events.id,
        name: events.name,
        displayId: productUsers.displayId,
        occurredAt: events.occurredAt,
        path: events.path,
        properties: events.properties,
      })
      .from(events)
      .innerJoin(analyticsProjects, eq(analyticsProjects.id, events.projectId))
      .innerJoin(repositories, eq(repositories.id, analyticsProjects.repositoryId))
      .leftJoin(productUsers, eq(productUsers.id, events.productUserId))
      .where(eq(repositories.name, slug))
      .orderBy(desc(events.occurredAt))
      .limit(100);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      displayId: row.displayId ?? "anonymous",
      occurredAt: row.occurredAt.toISOString(),
      path: row.path,
      properties: row.properties,
    }));
  } catch (error) {
    console.error("events_query_failed", { error });
    return [];
  }
}

export async function getUserTimeline(
  slug: string,
  userId: string,
): Promise<EventSummary[]> {
  if (!hasDatabase()) return [];

  try {
    const db = getDatabase();
    const rows = await db
      .select({
        id: events.id,
        name: events.name,
        displayId: productUsers.displayId,
        occurredAt: events.occurredAt,
        path: events.path,
        properties: events.properties,
      })
      .from(events)
      .innerJoin(analyticsProjects, eq(analyticsProjects.id, events.projectId))
      .innerJoin(repositories, eq(repositories.id, analyticsProjects.repositoryId))
      .innerJoin(productUsers, eq(productUsers.id, events.productUserId))
      .where(and(eq(repositories.name, slug), eq(productUsers.id, userId)))
      .orderBy(desc(events.occurredAt))
      .limit(50);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      displayId: row.displayId,
      occurredAt: row.occurredAt.toISOString(),
      path: row.path,
      properties: row.properties,
    }));
  } catch (error) {
    console.error("user_timeline_query_failed", { error });
    return [];
  }
}

export async function getEventBreakdown(slug: string) {
  const googleMetrics = await getGoogleAnalyticsMetricsForRepository(slug);
  if (googleMetrics) {
    const eventsMap = new Map<string, number>();
    const referrers = new Map<string, number>();
    for (const metric of googleMetrics) {
      for (const [name, count] of Object.entries(metric.eventBreakdown)) {
        eventsMap.set(name, (eventsMap.get(name) ?? 0) + count);
      }
      for (const [name, count] of Object.entries(metric.referrerBreakdown)) {
        referrers.set(name, (referrers.get(name) ?? 0) + count);
      }
    }
    const sortedEvents = [...eventsMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const largestEvent = sortedEvents[0]?.[1] ?? 1;
    return {
      topEvents: sortedEvents.map(([name, count]) => ({
        name,
        count,
        share: Math.round((count / largestEvent) * 100),
      })),
      referrers: [...referrers.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, count]) => ({ name, count })),
    };
  }

  if (!hasDatabase()) return { topEvents: [], referrers: [] };

  try {
    const db = getDatabase();
    const eventRows = await db
      .select({
        name: events.name,
        count: sql<number>`count(*)::int`,
      })
      .from(events)
      .innerJoin(analyticsProjects, eq(analyticsProjects.id, events.projectId))
      .innerJoin(repositories, eq(repositories.id, analyticsProjects.repositoryId))
      .where(
        and(
          eq(repositories.name, slug),
          gte(events.occurredAt, sql`now() - interval '30 days'`),
        ),
      )
      .groupBy(events.name)
      .orderBy(sql`count(*) desc`)
      .limit(5);

    const referrerRows = await db
      .select({
        name: sessions.referrer,
        count: sql<number>`count(*)::int`,
      })
      .from(sessions)
      .innerJoin(analyticsProjects, eq(analyticsProjects.id, sessions.projectId))
      .innerJoin(repositories, eq(repositories.id, analyticsProjects.repositoryId))
      .where(
        and(
          eq(repositories.name, slug),
          gte(sessions.startedAt, sql`now() - interval '30 days'`),
        ),
      )
      .groupBy(sessions.referrer)
      .orderBy(sql`count(*) desc`)
      .limit(4);

    const largestEvent = eventRows[0]?.count ?? 1;
    return {
      topEvents: eventRows.map((row) => ({
        name: row.name,
        count: row.count,
        share: Math.round((row.count / largestEvent) * 100),
      })),
      referrers: referrerRows
        .filter((row) => row.name)
        .map((row) => ({ name: row.name as string, count: row.count })),
    };
  } catch (error) {
    console.error("breakdown_query_failed", { error });
    return { topEvents: [], referrers: [] };
  }
}
