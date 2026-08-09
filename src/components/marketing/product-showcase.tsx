import { EventLine, TaskLine, WaitingLine } from "@/components/marketing/ui-fragments";

/**
 * The authenticated dashboard, reproduced from the same primitives: greeting,
 * Today, Upcoming, Waiting On, Active life events, Pending suggestions. No
 * charts, no percentages, no numbers the product does not actually compute.
 */
export function ProductShowcase() {
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
        <span className="size-1.5 rounded-full bg-hairline-strong" aria-hidden />
        <span className="type-mono text-muted">Sonae — Dashboard</span>
      </div>

      <div className="bg-canvas p-4 sm:p-6 lg:p-8">
        <div className="space-y-1">
          <p className="type-mono text-muted">Sunday, August 9</p>
          <p className="type-section">Good morning, Faiz</p>
          <p className="type-body max-w-xl text-body">
            Today you need to return the Amazon package and follow up with your landlord. Two
            replies are still outstanding.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
          <div className="space-y-8">
            <section>
              <div className="flex items-baseline gap-2.5 border-b border-hairline pb-2.5">
                <h3 className="type-section">Today</h3>
                <span className="type-mono text-muted">2</span>
              </div>
              <ul className="divide-y divide-hairline-soft">
                <li>
                  <TaskLine title="Return Amazon package" due="Today" priority="high" />
                </li>
                <li>
                  <TaskLine title="Follow up with landlord" due="Today" />
                </li>
              </ul>
            </section>

            <section>
              <div className="flex items-baseline gap-2.5 border-b border-hairline pb-2.5">
                <h3 className="type-section">Upcoming</h3>
                <span className="type-mono text-muted">3</span>
              </div>
              <ul className="divide-y divide-hairline-soft">
                <li>
                  <TaskLine title="Update banking address" due="Aug 25" priority="high" />
                </li>
                <li>
                  <TaskLine title="Transfer internet service" due="Aug 27" />
                </li>
                <li>
                  <TaskLine title="Review passport renewal timeline" due="Sep 15" />
                </li>
              </ul>
            </section>

            <section>
              <div className="flex items-baseline gap-2.5 border-b border-hairline pb-2.5">
                <h3 className="type-section">Pending suggestions</h3>
                <span className="type-mono text-muted">1</span>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="type-card-title">New York Trip</p>
                  <p className="type-meta mt-0.5">Created a travel plan with 3 tasks.</p>
                </div>
                <span className="type-meta shrink-0">Review</span>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section>
              <div className="flex items-baseline gap-2.5 border-b border-hairline pb-2.5">
                <h3 className="type-section">Waiting On</h3>
                <span className="type-mono text-muted">2</span>
              </div>
              <ul className="divide-y divide-hairline-soft">
                <li>
                  <WaitingLine
                    duration="3 days"
                    title="Airline refund"
                    on="Airline support"
                    followUp="Aug 14"
                  />
                </li>
                <li>
                  <WaitingLine
                    duration="9 days"
                    title="Recruiter response"
                    on="Recruiter"
                    followUp="Aug 12"
                  />
                </li>
              </ul>
            </section>

            <section>
              <div className="flex items-baseline gap-2.5 border-b border-hairline pb-2.5">
                <h3 className="type-section">Active life events</h3>
                <span className="type-mono text-muted">2</span>
              </div>
              <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-1">
                <EventLine
                  title="Move to New House"
                  dates="Aug 9 – Sep 1"
                  done={1}
                  total={4}
                  next="Update banking address"
                />
                <EventLine
                  title="Headphones Return Window"
                  dates="Aug 9 – Sep 8"
                  done={0}
                  total={2}
                  next="Test the headphones properly"
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
