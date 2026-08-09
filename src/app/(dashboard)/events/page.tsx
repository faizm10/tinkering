import Link from "next/link";
import { Section } from "@/components/life-admin/section";
import { getAllLifeEvents } from "@/server/services/life-admin";

export default async function EventsPage() {
  const events = await getAllLifeEvents();
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="text-3xl font-semibold">Life Events</h1>
      <Section title="Active and recent events">
        <div className="divide-y divide-border">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`} className="block py-4">
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
