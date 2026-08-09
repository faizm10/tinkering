import { ActivityItem } from "@/components/sonae/activity-item";
import { PageHeader } from "@/components/sonae/page-header";
import { EmptyState } from "@/components/sonae/states";
import { getDashboardData } from "@/server/services/sonae";

export default async function HistoryPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-9">
      <PageHeader
        title="History"
        description="Everything Sonae has recorded, newest first."
      />

      {data.activity.length ? (
        <ul className="divide-y divide-hairline-soft border-t border-hairline">
          {data.activity.map((item) => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <EmptyState message="Nothing has happened yet." />
      )}
    </div>
  );
}
