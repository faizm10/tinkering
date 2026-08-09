import { AgentTimeline } from "@/components/agent/agent-timeline";
import { Reveal } from "@/components/marketing/reveal";
import {
  ComposerLine,
  FragmentLabel,
  TaskLine,
  WaitingLine,
} from "@/components/marketing/ui-fragments";
import { heroPlan } from "@/components/marketing/demo-data";

/**
 * Three steps, each paired with the actual interface at that moment. Numbered
 * editorially and connected by a rule rather than sitting in three matching
 * icon cards.
 */
const steps = [
  {
    number: "01",
    title: "Tell Sonae what’s happening",
    body: "One sentence, in whatever words you would use. No forms, no categories to pick, no project to set up first.",
  },
  {
    number: "02",
    title: "Review the plan it creates",
    body: "The agent proposes a life event with tasks, dates, reminders and follow-ups. Edit any of it, remove what you do not need, then approve.",
  },
  {
    number: "03",
    title: "Stay ahead until everything is done",
    body: "Deadlines surface on the day they matter. Anything you are waiting on gets a follow-up date and a record of how long it has been.",
  },
];

export function HowItWorks() {
  return (
    <ol className="divide-y divide-hairline border-t border-hairline">
      {steps.map((step, index) => (
        <Reveal as="li" key={step.number} delay={index * 0.04}>
          <div className="grid gap-6 py-10 lg:grid-cols-[auto_1fr_1.1fr] lg:gap-10 lg:py-12">
            <span className="type-mono text-muted lg:pt-1">{step.number}</span>

            <div className="max-w-md">
              <h3 className="type-section">{step.title}</h3>
              <p className="type-body mt-2 text-body">{step.body}</p>
            </div>

            <div className="surface-card p-4">
              {index === 0 ? <ComposerLine input={heroPlan.input} /> : null}

              {index === 1 ? (
                <div className="space-y-3">
                  <AgentTimeline stages={heroPlan.stages} />
                  <ul className="divide-y divide-hairline-soft border-t border-hairline-soft pt-1">
                    {heroPlan.tasks.slice(0, 3).map((task) => (
                      <li key={task.title}>
                        <TaskLine title={task.title} due={task.due} priority={task.priority} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {index === 2 ? (
                <div className="space-y-3">
                  <div>
                    <FragmentLabel>Today</FragmentLabel>
                    <ul className="divide-y divide-hairline-soft">
                      <li>
                        <TaskLine title="Update banking address" due="Today" priority="high" />
                      </li>
                      <li>
                        <TaskLine title="Change delivery addresses" due="Aug 30" done />
                      </li>
                    </ul>
                  </div>
                  <div className="border-t border-hairline-soft pt-1">
                    <FragmentLabel>Waiting on</FragmentLabel>
                    <WaitingLine
                      duration="3 days"
                      title="Internet transfer"
                      on="Provider support"
                      followUp="Aug 14"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
