import { X } from "lucide-react";

import { FragmentLabel } from "@/components/marketing/ui-fragments";
import { heroPlan } from "@/components/marketing/demo-data";

/**
 * Approval and control. Every claim here is something the product actually
 * enforces — no certifications, no compliance badges, no security theatre.
 */
const guarantees = [
  {
    title: "Plans stay suggestions until you approve them",
    body: "Nothing the agent proposes is written to your workspace until you press Add to Life Admin.",
  },
  {
    title: "Every task and date is editable",
    body: "Change a title, move a deadline, lower a priority or remove a suggestion entirely before it is saved.",
  },
  {
    title: "External actions require your confirmation",
    body: "Life Admin does not send email, make purchases, cancel services or delete anything on your behalf.",
  },
  {
    title: "Activity history shows what changed",
    body: "Approvals, completions and edits are recorded with a timestamp, so you can see how a plan got to its current state.",
  },
];

export function TrustSection() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
      <div>
        <ul className="divide-y divide-hairline border-t border-hairline">
          {guarantees.map((item) => (
            <li key={item.title} className="py-5">
              <h3 className="type-card-title">{item.title}</h3>
              <p className="type-body mt-1 text-body">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* The approval screen as it really is: editable rows, remove controls,
          one orange primary action and a plain secondary. */}
      <div className="surface-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
          <span className="size-1.5 rounded-full bg-hairline-strong" aria-hidden />
          <span className="type-mono text-muted">Life Admin — proposed plan</span>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <div>
            <FragmentLabel>Summary</FragmentLabel>
            <p className="type-section mt-1">Created a moving plan.</p>
          </div>

          <div>
            <FragmentLabel>Tasks</FragmentLabel>
            <ul className="mt-1 divide-y divide-hairline-soft" aria-hidden>
              {heroPlan.tasks.map((task) => (
                <li key={task.title} className="flex items-center gap-2 py-2.5">
                  <span className="min-w-0 flex-1 truncate rounded-[var(--radius-control)] border border-hairline-strong bg-surface px-3 py-2 text-[0.9375rem] text-ink">
                    {task.title}
                  </span>
                  <span className="hidden w-24 shrink-0 rounded-[var(--radius-control)] border border-hairline-strong bg-surface px-3 py-2 text-[0.9375rem] text-ink sm:block">
                    {task.priority === "high" ? "High" : "Medium"}
                  </span>
                  <span className="type-mono hidden w-28 shrink-0 rounded-[var(--radius-control)] border border-hairline-strong bg-surface px-3 py-2 text-ink md:block">
                    {task.due}
                  </span>
                  <span className="grid size-8 shrink-0 place-items-center text-muted">
                    <X className="size-4" />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 border-t border-hairline-soft pt-4">
            <p className="type-meta">
              Review this plan before adding it. Life Admin will not take external actions without
              your approval.
            </p>
            <div aria-hidden className="flex flex-wrap gap-2">
              <span className="inline-flex h-10 items-center rounded-[var(--radius-control)] bg-primary px-[18px] text-sm font-medium text-on-primary">
                Add to Life Admin
              </span>
              <span className="inline-flex h-10 items-center rounded-[var(--radius-control)] border border-hairline-strong bg-surface px-[18px] text-sm font-medium text-ink">
                Discard plan
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
