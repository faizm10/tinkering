import Link from "next/link";

import { AgentTimeline } from "@/components/agent/agent-timeline";
import { Reveal } from "@/components/marketing/reveal";
import {
  EventLine,
  FragmentLabel,
  TaskLine,
  WaitingLine,
} from "@/components/marketing/ui-fragments";
import { heroPlan } from "@/components/marketing/demo-data";

/**
 * Six capabilities in an asymmetric arrangement: one wide anchor tile with the
 * agent timeline, then progressively smaller fragments. Deliberately not a
 * six-up grid of matching cards.
 */
export function Capabilities() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Anchor tile — the capability everything else depends on. */}
      <Reveal className="lg:col-span-2">
        <article className="surface-card flex h-full flex-col gap-5 p-5 sm:p-6">
          <div className="max-w-md">
            <h3 className="type-card-title">Turn situations into plans</h3>
            <p className="type-body mt-1.5 text-body">
              The agent reads what you wrote, resolves the dates it implies, and groups the work
              into one life event you can act on.
            </p>
          </div>
          <div className="mt-auto space-y-3 border-t border-hairline-soft pt-4">
            <AgentTimeline stages={heroPlan.stages} />
            <ul className="divide-y divide-hairline-soft">
              {heroPlan.tasks.slice(0, 2).map((task) => (
                <li key={task.title}>
                  <TaskLine title={task.title} due={task.due} priority={task.priority} />
                </li>
              ))}
            </ul>
          </div>
        </article>
      </Reveal>

      <Reveal delay={0.04}>
        <article className="surface-card flex h-full flex-col gap-4 p-5 sm:p-6">
          <div>
            <h3 className="type-card-title">Track important deadlines</h3>
            <p className="type-body mt-1.5 text-body">
              Dates are read in your timezone and surface as words, not just numbers.
            </p>
          </div>
          <div className="mt-auto border-t border-hairline-soft pt-3">
            <FragmentLabel>Today</FragmentLabel>
            <ul className="divide-y divide-hairline-soft">
              <li>
                <TaskLine title="Return Amazon package" due="Today" priority="high" />
              </li>
              <li>
                <TaskLine title="Submit renewal form" due="Overdue by 2 days" />
              </li>
            </ul>
          </div>
        </article>
      </Reveal>

      <Reveal delay={0.06}>
        <article className="surface-card flex h-full flex-col gap-4 p-5 sm:p-6">
          <div>
            <h3 className="type-card-title">Remember what you’re waiting on</h3>
            <p className="type-body mt-1.5 text-body">
              Every open thread keeps a follow-up date and a running count of the days.
            </p>
          </div>
          <div className="mt-auto border-t border-hairline-soft pt-1">
            <WaitingLine
              duration="9 days"
              title="Recruiter response"
              on="Recruiter"
              followUp="Aug 12"
            />
          </div>
        </article>
      </Reveal>

      <Reveal delay={0.08} className="lg:col-span-2">
        <article className="surface-card grid h-full gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <h3 className="type-card-title">Organize larger life events</h3>
            <p className="type-body mt-1.5 text-body">
              A move or a trip stays one thread — its timeline, tasks, reminders and follow-ups in
              one place, with progress you can read at a glance.
            </p>
          </div>
          <div className="border-t border-hairline-soft pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <EventLine
              title="Move to New House"
              dates="Aug 9 – Sep 1"
              done={1}
              total={4}
              next="Update banking address"
            />
          </div>
        </article>
      </Reveal>

      <Reveal delay={0.1}>
        <article className="surface-card flex h-full flex-col gap-4 p-5 sm:p-6">
          <div>
            <h3 className="type-card-title">Prepare a useful daily brief</h3>
            <p className="type-body mt-1.5 text-body">
              One short paragraph each morning, written from what is actually due.
            </p>
          </div>
          <div className="mt-auto border-t border-hairline-soft pt-4">
            <p className="type-mono text-muted">Sunday, August 9</p>
            <p className="type-body mt-1.5 text-ink">
              Today you need to return the Amazon package and follow up with your landlord. Two
              replies are still outstanding.
            </p>
          </div>
        </article>
      </Reveal>

      <Reveal delay={0.12} className="lg:col-span-2">
        <article className="surface-card grid h-full gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <h3 className="type-card-title">Keep actions under your control</h3>
            <p className="type-body mt-1.5 text-body">
              A plan is a suggestion until you approve it. Life Admin does not send, buy, cancel or
              delete anything on your behalf.
            </p>
            <Link
              href="#security"
              className="mt-1 inline-flex min-h-11 items-center text-sm text-ink underline decoration-hairline-strong underline-offset-4 transition-colors duration-[var(--dur-hover)] hover:decoration-ink"
            >
              How approval works
            </Link>
          </div>
          <div className="border-t border-hairline-soft pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <FragmentLabel>Activity</FragmentLabel>
            <ul className="mt-1.5 space-y-2">
              {[
                { at: "Aug 9, 09:12", what: "Approved “Move to New House” and saved its tasks." },
                { at: "Aug 9, 09:12", what: "Agent created a plan suggestion." },
              ].map((entry) => (
                <li key={entry.at + entry.what}>
                  <p className="type-mono text-muted">{entry.at}</p>
                  <p className="type-body text-ink">{entry.what}</p>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </Reveal>
    </div>
  );
}
