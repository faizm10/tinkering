import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDatabase, hasDatabase } from "@/db";
import {
  analyticsProjects,
  dailyAggregates,
  events,
  productUsers,
  repositories,
  sessions,
} from "@/db/schema";
import {
  demoEvents,
  demoReferrers,
  demoRepositories,
  demoTopEvents,
  demoTrend,
  demoUsers,
  type EventSummary,
  type ProductUserSummary,
  type RepositorySummary,
  type TrendPoint,
} from "./demo-data";
import { getGoogleAnalyticsMetricsForRepository } from "./google-analytics-admin";

export async function getPortfolio(): Promise<RepositorySummary[]> {
  if (!hasDatabase()) return demoRepositories;

  try {
    const db = getDatabase();
    const rows = await db
      .select({
        id: repositories.id,
        slug: repositories.name,
        fullName: repositories.fullName,
        private: repositories.private,
        projectId: analyticsProjects.id,
        activeUsers: sql<number>`coalesce(sum(${dailyAggregates.activeVisitors}), 0)::int`,
        sessions: sql<number>`coalesce(sum(${dailyAggregates.sessions}), 0)::int`,
        events: sql<number>`coalesce(sum(${dailyAggregates.events}), 0)::int`,
      })
      .from(repositories)
      .leftJoin(analyticsProjects, eq(analyticsProjects.repositoryId, repositories.id))
      .leftJoin(
        dailyAggregates,
        and(
          eq(dailyAggregates.projectId, analyticsProjects.id),
          gte(dailyAggregates.day, sql`current_date - interval '30 days'`),
        ),
      )
      .where(eq(repositories.selected, true))
      .groupBy(repositories.id, analyticsProjects.id)
      .orderBy(desc(sql`coalesce(sum(${dailyAggregates.events}), 0)`));

    return Promise.all(
      rows.map(async (row) => {
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
          };
        }

        return {
          id: row.id,
          slug: row.slug,
          fullName: row.fullName,
          private: row.private,
          activeUsers: row.activeUsers,
          sessions: row.sessions,
          events: row.events,
          change: 0,
          status: row.projectId ? ("live" as const) : ("setup" as const),
          analyticsSource: "native" as const,
        };
      }),
    );
  } catch (error) {
    console.error("portfolio_query_failed", { error });
    return demoRepositories;
  }
}

export async function getRepository(slug: string) {
  const portfolio = await getPortfolio();
  return portfolio.find((repository) => repository.slug === slug) ?? null;
}

export async function getTrend(slug: string): Promise<TrendPoint[]> {
  if (!hasDatabase()) return demoTrend;

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
    const rows = await db
      .select({
        day: dailyAggregates.day,
        users: dailyAggregates.activeVisitors,
        sessions: dailyAggregates.sessions,
        events: dailyAggregates.events,
      })
      .from(dailyAggregates)
      .innerJoin(analyticsProjects, eq(analyticsProjects.id, dailyAggregates.projectId))
      .innerJoin(repositories, eq(repositories.id, analyticsProjects.repositoryId))
      .where(
        and(
          eq(repositories.name, slug),
          gte(dailyAggregates.day, sql`current_date - interval '30 days'`),
        ),
      )
      .orderBy(dailyAggregates.day);

    return rows.map((row) => ({
      day: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
        new Date(`${row.day}T00:00:00Z`),
      ),
      users: row.users,
      sessions: row.sessions,
      events: row.events,
    }));
  } catch (error) {
    console.error("trend_query_failed", { error });
    return demoTrend;
  }
}

export async function getUsers(slug: string): Promise<ProductUserSummary[]> {
  if (!hasDatabase()) return demoUsers;

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
    return demoUsers;
  }
}

export async function getEvents(slug: string): Promise<EventSummary[]> {
  if (!hasDatabase()) return demoEvents;

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
    return demoEvents;
  }
}

export async function getEventBreakdown(slug: string) {
  const googleMetrics = await getGoogleAnalyticsMetricsForRepository(slug);
  if (googleMetrics) {
    const events = new Map<string, number>();
    const referrers = new Map<string, number>();
    for (const metric of googleMetrics) {
      for (const [name, count] of Object.entries(metric.eventBreakdown)) {
        events.set(name, (events.get(name) ?? 0) + count);
      }
      for (const [name, count] of Object.entries(metric.referrerBreakdown)) {
        referrers.set(name, (referrers.get(name) ?? 0) + count);
      }
    }
    const sortedEvents = [...events.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
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
  return { topEvents: demoTopEvents, referrers: demoReferrers };
}
