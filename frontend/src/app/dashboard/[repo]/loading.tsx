export default function RepositoryLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-full max-w-md rounded-lg bg-secondary" />
      <div className="h-20 rounded-xl border border-border/40 bg-card/40" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-28 rounded-xl border border-border/40 bg-card/40" />
        ))}
      </div>
      <div className="h-72 rounded-xl border border-border/40 bg-card/40" />
    </div>
  );
}
