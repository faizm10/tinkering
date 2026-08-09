import { notFound } from "next/navigation";
import { parseISO } from "date-fns";

import { LifeEventProgress } from "@/components/events/life-event-progress";
import { ActivityItem } from "@/components/sonae/activity-item";
import { PageHeader } from "@/components/sonae/page-header";
import { EventStatus, Tag } from "@/components/sonae/status-indicator";
import { EmptyState } from "@/components/sonae/states";
import { TaskGroup } from "@/components/tasks/task-group";
import { WaitingItem } from "@/components/waiting/waiting-item";
import { formatDateRange, formatShortDate, todayISO } from "@/lib/dates";
import { getLifeEvent } from "@/server/services/sonae";
import type { LifeEventDetail } from "@/server/services/types";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getLifeEvent(id);
  if (!event) notFound();

  const completedTasks = event.tasks.filter((task) => task.status === "completed").length;
  const openWaiting = event.waiting.filter((item) => item.status === "waiting");
  const milestones = buildTimeline(event);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={event.category}
        title={event.title}
        description={event.description || undefined}
      />

      <section aria-label="Overview" className="surface-card p-4 sm:p-5">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="type-label">Status</dt>
            <dd className="mt-1">
              <EventStatus status={event.status} />
            </dd>
          </div>
          <div>
            <dt className="type-label">Dates</dt>
            <dd className="type-mono mt-1 text-ink">
              {formatDateRange(event.startDate, event.endDate)}
            </dd>
          </div>
          <div>
            <dt className="type-label">Waiting on</dt>
            <dd className="type-body mt-1 text-ink">
              {openWaiting.length
                ? `${openWaiting.length} ${openWaiting.length === 1 ? "reply" : "replies"}`
                : "Nobody"}
            </dd>
          </div>
        </dl>
        <div className="mt-5 border-t border-hairline-soft pt-4">
          <LifeEventProgress completed={completedTasks} total={event.tasks.length} />
        </div>
      </section>

      <section>
        <h2 className="type-section border-b border-hairline pb-2.5">Timeline</h2>
        {milestones.length ? (
          <ol className="divide-y divide-hairline-soft">
            {milestones.map((milestone) => (
              <li
                key={`${milestone.label}-${milestone.date}`}
                className="flex items-baseline gap-4 py-2.5"
              >
                <time
                  dateTime={milestone.date}
                  className={`type-mono w-20 shrink-0 ${milestone.past ? "text-muted-soft" : "text-ink"}`}
                >
                  {formatShortDate(milestone.date)}
                </time>
                <span className="type-body min-w-0 text-body">{milestone.label}</span>
                {milestone.kind ? <Tag className="ml-auto shrink-0">{milestone.kind}</Tag> : null}
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState message="This event has no dated milestones yet." />
        )}
      </section>

      <section>
        <h2 className="type-section border-b border-hairline pb-2.5">Tasks</h2>
        {event.tasks.length ? (
          <TaskGroup tasks={event.tasks} showEventLink={false} />
        ) : (
          <EmptyState message="No tasks attached to this event." />
        )}
      </section>

      <section>
        <h2 className="type-section border-b border-hairline pb-2.5">Reminders</h2>
        {event.reminders.length ? (
          <ul className="divide-y divide-hairline-soft">
            {event.reminders.map((reminder) => (
              <li key={reminder.id} className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="type-body min-w-0 text-ink">{reminder.title}</span>
                <time dateTime={reminder.remindAt} className="type-mono shrink-0 text-muted">
                  {formatShortDate(reminder.remindAt.slice(0, 10))}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message="No reminders scheduled for this event." />
        )}
      </section>

      <section>
        <h2 className="type-section border-b border-hairline pb-2.5">Waiting on</h2>
        {event.waiting.length ? (
          <ul className="divide-y divide-hairline-soft">
            {event.waiting.map((item) => (
              <WaitingItem key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <EmptyState message="Nothing here depends on someone else." />
        )}
      </section>

      <section>
        <h2 className="type-section border-b border-hairline pb-2.5">Activity</h2>
        {event.activity.length ? (
          <ul className="divide-y divide-hairline-soft">
            {event.activity.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <EmptyState message="Nothing has happened on this event yet." />
        )}
      </section>
    </div>
  );
}

type Milestone = { date: string; label: string; kind?: string; past: boolean };

/** Every dated thing on the event, in order. Built from real records only. */
function buildTimeline(event: LifeEventDetail): Milestone[] {
  const today = todayISO();
  const entries: { date: string; label: string; kind?: string }[] = [];

  if (event.startDate) entries.push({ date: event.startDate, label: `${event.title} starts` });
  event.tasks.forEach((task) => {
    if (task.dueDate) entries.push({ date: task.dueDate, label: task.title, kind: "task" });
  });
  event.waiting.forEach((item) => {
    if (item.followUpDate) {
      entries.push({ date: item.followUpDate, label: `Follow up: ${item.title}`, kind: "waiting" });
    }
  });
  event.reminders.forEach((reminder) => {
    entries.push({ date: reminder.remindAt.slice(0, 10), label: reminder.title, kind: "reminder" });
  });
  if (event.endDate) entries.push({ date: event.endDate, label: `${event.title} ends` });

  return entries
    .sort((a, b) => (parseISO(a.date) < parseISO(b.date) ? -1 : 1))
    .map((entry) => ({ ...entry, past: entry.date < today }));
}
