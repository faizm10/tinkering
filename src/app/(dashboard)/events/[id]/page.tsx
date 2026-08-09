import { notFound } from "next/navigation";
import { Section } from "@/components/life-admin/section";
import { getLifeEvent } from "@/server/services/life-admin";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getLifeEvent(id);
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <p className="text-sm text-muted-foreground">{event.category}</p>
        <h1 className="text-3xl font-semibold">{event.title}</h1>
      </header>
      <Section title="Details">
        <p className="text-muted-foreground">{event.description}</p>
        <dl className="mt-5 grid gap-4 text-sm md:grid-cols-3">
          <div><dt className="text-muted-foreground">Status</dt><dd className="font-medium">{event.status}</dd></div>
          <div><dt className="text-muted-foreground">Start</dt><dd className="font-medium">{event.startDate ?? "Not set"}</dd></div>
          <div><dt className="text-muted-foreground">End</dt><dd className="font-medium">{event.endDate ?? "Not set"}</dd></div>
        </dl>
      </Section>
    </div>
  );
}
