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
  isDemoSetupRepository,
  type EventSummary,
  type ProductUserSummary,
  type RepositorySummary,
  type TrendPoint,
} from "./demo-data";
import { clerkConfigured } from "./auth";
import { getGoogleAnalyticsMetricsForRepository } from "./google-analytics-admin";

function useDemoFallback() {
  return !hasDatabase() && !clerkConfigured;
}

function demoRepositoryHasNoData(slug: string) {
  return useDemoFallback() && isDemoSetupRepository(slug);
}

export async function getPortfolio(): Promise<RepositorySummary[]> {
  if (useDemoFallback()) return demoRepositories;
  if (!hasDatabase()) return [];

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
          lastEventAt,
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

export async function getTrend(slug: string): Promise<TrendPoint[]> {
  if (demoRepositoryHasNoData(slug)) return [];
  if (useDemoFallback()) return demoTrend;
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
    return [];
  }
}

export async function getPortfolioTrend(): Promise<TrendPoint[]> {
  if (useDemoFallback()) return demoTrend;
  if (!hasDatabase()) return [];

  try {
    const db = getDatabase();
    const rows = await db
      .select({
        day: dailyAggregates.day,
        users: sql<number>`coalesce(sum(${dailyAggregates.activeVisitors}), 0)::int`,
        sessions: sql<number>`coalesce(sum(${dailyAggregates.sessions}), 0)::int`,
        events: sql<number>`coalesce(sum(${dailyAggregates.events}), 0)::int`,
      })
      .from(dailyAggregates)
      .innerJoin(analyticsProjects, eq(analyticsProjects.id, dailyAggregates.projectId))
      .innerJoin(repositories, eq(repositories.id, analyticsProjects.repositoryId))
      .where(
        and(
          eq(repositories.selected, true),
          gte(dailyAggregates.day, sql`current_date - interval '30 days'`),
        ),
      )
      .groupBy(dailyAggregates.day)
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
    console.error("portfolio_trend_query_failed", { error });
    return [];
  }
}

export async function getUsers(slug: string): Promise<ProductUserSummary[]> {
  if (demoRepositoryHasNoData(slug)) return [];
  if (useDemoFallback()) return demoUsers;
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
  if (demoRepositoryHasNoData(slug)) return [];
  if (useDemoFallback()) return demoEvents;
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
  if (demoRepositoryHasNoData(slug)) return [];
  if (useDemoFallback()) {
    const user = demoUsers.find((entry) => entry.id === userId);
    if (!user) return [];
    return demoEvents
      .filter((event) => event.displayId === user.displayId)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }
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
  if (demoRepositoryHasNoData(slug)) {
    return { topEvents: [], referrers: [] };
  }
  if (useDemoFallback()) {
    return { topEvents: demoTopEvents, referrers: demoReferrers };
  }
  if (!hasDatabase()) {
    return { topEvents: [], referrers: [] };
  }

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
