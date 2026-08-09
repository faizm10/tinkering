import { LifeEventCard } from "@/components/events/life-event-card";
import { PageHeader } from "@/components/life-admin/page-header";
import { EmptyState } from "@/components/life-admin/states";
import { getAllLifeEvents } from "@/server/services/life-admin";

export default async function EventsPage() {
  const events = await getAllLifeEvents();
  const active = events.filter((event) => event.status === "active");
  const closed = events.filter((event) => event.status !== "active");

  return (
    <div className="space-y-9">
      <PageHeader
        title="Life Events"
        description="Everything Life Admin is currently keeping track of for you."
      />

      {events.length === 0 ? (
        <EmptyState
          message="Tell Life Admin what’s happening and it will organize the details."
          action={{ label: "Open the composer", href: "/dashboard" }}
        />
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="type-section border-b border-hairline pb-2.5">Active</h2>
            {active.length ? (
              <div className="grid gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-3">
                {active.map((event) => (
                  <LifeEventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState message="No active events right now." />
            )}
          </section>

          {closed.length ? (
            <section>
              <h2 className="type-section border-b border-hairline pb-2.5">Closed</h2>
              <div className="grid gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-3">
                {closed.map((event) => (
                  <LifeEventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
