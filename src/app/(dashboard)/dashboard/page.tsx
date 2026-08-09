import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AgentComposer } from "@/components/agent/agent-composer";
import { DailyBrief } from "@/components/dashboard/daily-brief";
import { LifeEventCard } from "@/components/events/life-event-card";
import { Section } from "@/components/life-admin/section";
import { EmptyState } from "@/components/life-admin/states";
import { TaskGroup } from "@/components/tasks/task-group";
import { WaitingItem } from "@/components/waiting/waiting-item";
import { Button } from "@/components/ui/button";
import { buildDailyBrief } from "@/server/daily-brief/brief";
import { getDashboardData } from "@/server/services/life-admin";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const brief = buildDailyBrief(data);
  const upcoming = data.upcoming.slice(0, 5);
  const recentlyCompleted = data.recentlyCompleted.slice(0, 4);

  return (
    <div className="space-y-10">
      <DailyBrief name={data.profile.name} brief={brief} />

      <AgentComposer />

      <Section title="Today" count={data.today.length}>
        {data.today.length ? (
          <TaskGroup tasks={data.today} events={data.lifeEvents} />
        ) : (
          <EmptyState
            message="You’re clear for today."
            hint="Anything with a deadline today will show up here."
          />
        )}
      </Section>

      <Section
        title="Upcoming"
        count={data.upcoming.length}
        action={
          data.upcoming.length > upcoming.length ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/tasks">
                All tasks <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          ) : null
        }
      >
        {upcoming.length ? (
          <TaskGroup tasks={upcoming} events={data.lifeEvents} />
        ) : (
          <EmptyState message="Nothing scheduled beyond today." />
        )}
      </Section>

      <Section
        title="Waiting On"
        count={data.waiting.length}
        action={
          data.waiting.length ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/waiting">
                Open <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          ) : null
        }
      >
        {data.waiting.length ? (
          <ul className="divide-y divide-hairline-soft">
            {data.waiting.slice(0, 3).map((item) => (
              <WaitingItem key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <EmptyState message="Nothing is waiting on someone else." />
        )}
      </Section>

      <Section
        title="Active life events"
        count={data.lifeEvents.length}
        action={
          data.lifeEvents.length ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/events">
                All events <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          ) : null
        }
      >
        {data.lifeEvents.length ? (
          <div className="grid gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.lifeEvents.map((event) => (
              <LifeEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState message="Tell Life Admin what’s happening and it will organize the details." />
        )}
      </Section>

      <Section title="Pending suggestions" count={data.proposals.length}>
        {data.proposals.length ? (
          <ul className="divide-y divide-hairline-soft">
            {data.proposals.map((proposal) => (
              <li key={proposal.id}>
                <Link
                  href={`/approvals?proposal=${proposal.id}`}
                  className="group/proposal flex items-start justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="type-card-title">{proposal.proposedPlanJson.lifeEvent.title}</p>
                    <p className="type-meta mt-0.5 line-clamp-2">
                      {proposal.proposedPlanJson.summary}
                    </p>
                  </div>
                  <span className="type-meta shrink-0 transition-colors duration-[var(--dur-hover)] group-hover/proposal:text-ink">
                    Review
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message="No plans waiting for review." />
        )}
      </Section>

      {recentlyCompleted.length ? (
        <Section title="Recently completed" count={data.recentlyCompleted.length}>
          <TaskGroup tasks={recentlyCompleted} events={data.lifeEvents} />
        </Section>
      ) : null}
    </div>
  );
}
