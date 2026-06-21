import { sql } from "drizzle-orm";
import { getDatabase, hasDatabase } from "@/db";
import { syncAllGoogleAnalyticsConnections } from "@/lib/google-analytics";

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return Response.json({ error: "database_not_configured" }, { status: 503 });
  }

  const startedAt = performance.now();
  const db = getDatabase();

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`
        do $$
        declare
          partition_start date := (date_trunc('month', current_date) + interval '3 months')::date;
          partition_end date := (date_trunc('month', current_date) + interval '4 months')::date;
          partition_name text := 'events_' || to_char(partition_start, 'YYYY_MM');
        begin
          if to_regclass(partition_name) is null then
            execute format(
              'create table %I partition of events for values from (%L) to (%L)',
              partition_name,
              partition_start,
              partition_end
            );
          end if;
        end $$;
      `);

      await tx.execute(sql`
        insert into daily_aggregates (
          project_id,
          day,
          active_visitors,
          identified_users,
          sessions,
          pageviews,
          events,
          event_breakdown,
          referrer_breakdown
        )
        select
          e.project_id,
          (e.occurred_at at time zone 'UTC')::date as day,
          count(distinct e.visitor_id)::int,
          count(distinct e.product_user_id) filter (where e.product_user_id is not null)::int,
          count(distinct e.session_id)::int,
          count(*) filter (where e.name = '$pageview')::int,
          count(*)::int,
          (
            select jsonb_object_agg(name, event_count)
            from (
              select e2.name, count(*)::int as event_count
              from events e2
              where e2.project_id = e.project_id
                and (e2.occurred_at at time zone 'UTC')::date =
                    (e.occurred_at at time zone 'UTC')::date
              group by e2.name
            ) event_counts
          ),
          (
            select coalesce(jsonb_object_agg(referrer, referrer_count), '{}'::jsonb)
            from (
              select coalesce(nullif(e3.referrer, ''), 'Direct') as referrer,
                     count(*)::int as referrer_count
              from events e3
              where e3.project_id = e.project_id
                and e3.name = '$pageview'
                and (e3.occurred_at at time zone 'UTC')::date =
                    (e.occurred_at at time zone 'UTC')::date
              group by coalesce(nullif(e3.referrer, ''), 'Direct')
            ) referrer_counts
          )
        from events e
        where e.occurred_at >= date_trunc('day', now() at time zone 'UTC') - interval '1 day'
          and e.occurred_at < date_trunc('day', now() at time zone 'UTC')
        group by e.project_id, (e.occurred_at at time zone 'UTC')::date
        on conflict (project_id, day) do update set
          active_visitors = excluded.active_visitors,
          identified_users = excluded.identified_users,
          sessions = excluded.sessions,
          pageviews = excluded.pageviews,
          events = excluded.events,
          event_breakdown = excluded.event_breakdown,
          referrer_breakdown = excluded.referrer_breakdown,
          updated_at = now()
      `);

      await tx.execute(sql`
        delete from events e
        using analytics_projects p
        where e.project_id = p.id
          and e.occurred_at < now() - make_interval(days => p.retention_days)
      `);

      await tx.execute(sql`
        delete from ingestion_batches
        where created_at < now() - interval '7 days'
      `);
    });

    const googleAnalyticsResults = await syncAllGoogleAnalyticsConnections();
    const googleAnalyticsFailures = googleAnalyticsResults.filter(
      (result) => result.status === "rejected",
    ).length;
    const durationMs = Math.round(performance.now() - startedAt);
    console.info("daily_aggregation_completed", {
      durationMs,
      googleAnalyticsConnections: googleAnalyticsResults.length,
      googleAnalyticsFailures,
    });
    return Response.json({
      ok: true,
      durationMs,
      googleAnalyticsConnections: googleAnalyticsResults.length,
      googleAnalyticsFailures,
    });
  } catch (error) {
    console.error("daily_aggregation_failed", { error });
    return Response.json({ error: "aggregation_failed" }, { status: 500 });
  }
}
