import { LifeEventForm } from "@/components/events/life-event-form";
import { PageHeader } from "@/components/sonae/page-header";

export default function NewEventPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Add Event"
        description="Create a life event manually when you already know what needs tracking."
      />
      <LifeEventForm mode="create" />
    </div>
  );
}
