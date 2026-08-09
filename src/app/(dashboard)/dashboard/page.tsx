import { format } from "date-fns";
import Link from "next/link";
import { EmptyState, Section } from "@/components/life-admin/section";
import { SituationComposer } from "@/components/dashboard/situation-composer";
import { TaskRow } from "@/components/dashboard/task-row";
import { buildDailyBrief } from "@/server/daily-brief/brief";
import { getDashboardData } from "@/server/services/life-admin";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const brief = buildDailyBrief(data);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
          <h1 className="text-3xl font-semibold">Good morning, {data.profile.name}</h1>
        </div>
        <p className="max-w-xl text-sm text-muted-foreground">{brief}</p>
      </header>
      <SituationComposer />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Section title="Today">
          {data.today.length ? data.today.map((task) => <TaskRow key={task.id} task={task} />) : <EmptyState>No tasks need attention today.</EmptyState>}
        </Section>
        <Section title="Waiting On">
          {data.waiting.length ? (
            <div className="space-y-3">
              {data.waiting.map((item) => (
                <div key={item.id} className="border-b border-border pb-3 last:border-b-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.waitingOn}</p>
                  {item.followUpDate ? <p className="mt-1 text-xs text-muted-foreground">Follow up {item.followUpDate}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>Nothing is blocked on another person or company.</EmptyState>
          )}
        </Section>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Section title="Upcoming">
          {data.upcoming.length ? data.upcoming.slice(0, 4).map((task) => <TaskRow key={task.id} task={task} />) : <EmptyState>No upcoming tasks.</EmptyState>}
        </Section>
        <Section title="Active Life Events">
          <div className="space-y-3">
            {data.lifeEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="block border-b border-border pb-3 last:border-b-0">
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </Link>
            ))}
          </div>
        </Section>
        <Section title="Agent Suggestions">
          {data.proposals.length ? (
            <div className="space-y-3">
              {data.proposals.map((proposal) => (
                <Link key={proposal.id} href={`/approvals?proposal=${proposal.id}`} className="block border-b border-border pb-3 last:border-b-0">
                  <p className="font-medium">{proposal.proposedPlanJson.lifeEvent.title}</p>
                  <p className="text-sm text-muted-foreground">{proposal.proposedPlanJson.summary}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState>No pending proposals.</EmptyState>
          )}
        </Section>
      </div>
      <Section title="Recently Completed">
        {data.recentlyCompleted.length ? data.recentlyCompleted.map((task) => <TaskRow key={task.id} task={task} />) : <EmptyState>Completed tasks will appear here.</EmptyState>}
      </Section>
    </div>
  );
}
