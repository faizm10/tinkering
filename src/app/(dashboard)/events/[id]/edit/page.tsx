import { notFound } from "next/navigation";

import { LifeEventForm } from "@/components/events/life-event-form";
import { PageHeader } from "@/components/sonae/page-header";
import { getLifeEvent } from "@/server/services/sonae";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getLifeEvent(id);
  if (!event) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={event.category}
        title="Edit Event"
        description={event.title}
      />
      <LifeEventForm mode="edit" event={event} />
    </div>
  );
}
