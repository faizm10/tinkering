import { Section } from "@/components/life-admin/section";
import { getDashboardData } from "@/server/services/life-admin";

export default async function HistoryPage() {
  const data = await getDashboardData();
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="text-3xl font-semibold">Activity History</h1>
      <Section title="Recent activity">
        <div className="divide-y divide-border">
          {data.activity.map((item) => (
            <div key={item.id} className="py-4">
              <p className="font-medium">{item.description}</p>
              <p className="text-xs text-muted-foreground">{item.action} · {new Date(item.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
