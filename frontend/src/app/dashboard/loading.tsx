export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-secondary" />
        <div className="h-9 w-72 max-w-full rounded bg-secondary" />
        <div className="h-4 w-full max-w-xl rounded bg-secondary" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-28 rounded-xl border border-border/40 bg-card/40" />
        ))}
      </div>
      <div className="h-72 rounded-xl border border-border/40 bg-card/40" />
      <div className="h-64 rounded-xl border border-border/40 bg-card/40" />
    </div>
  );
}
