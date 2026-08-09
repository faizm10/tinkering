import { Section } from "@/components/life-admin/section";
import { getDashboardData } from "@/server/services/life-admin";

export default async function WaitingPage() {
  const data = await getDashboardData();
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="text-3xl font-semibold">Waiting Items</h1>
      <Section title="Blocked by someone else">
        <div className="divide-y divide-border">
          {data.waiting.map((item) => (
            <div key={item.id} className="py-4">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">Waiting on {item.waitingOn} · Follow up {item.followUpDate ?? "not set"}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
