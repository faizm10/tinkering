import { PageHeader } from "@/components/life-admin/page-header";
import { Section } from "@/components/life-admin/section";
import { EmptyState } from "@/components/life-admin/states";
import { WaitingItem } from "@/components/waiting/waiting-item";
import { getAllWaitingItems } from "@/server/services/life-admin";

export default async function WaitingPage() {
  const items = await getAllWaitingItems();
  const open = items.filter((item) => item.status === "waiting" || item.status === "follow_up_due");
  const resolved = items.filter((item) => item.status === "resolved");

  return (
    <div className="space-y-9">
      <PageHeader
        title="Waiting On"
        description="Things that are out of your hands until someone else replies."
      />

      <Section title="Open" count={open.length}>
        {open.length ? (
          <ul className="divide-y divide-hairline-soft">
            {open.map((item) => (
              <WaitingItem key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <EmptyState
            message="Nothing is waiting on someone else."
            hint="When Life Admin drafts a plan that depends on a reply, it will land here."
          />
        )}
      </Section>

      {resolved.length ? (
        <Section title="Resolved" count={resolved.length}>
          <ul className="divide-y divide-hairline-soft">
            {resolved.map((item) => (
              <WaitingItem key={item.id} item={item} />
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
