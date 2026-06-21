export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-5 p-8">
      <div className="h-8 w-64 rounded bg-secondary" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-32 rounded-xl bg-secondary" />
        ))}
      </div>
      <div className="h-96 rounded-xl bg-secondary" />
    </div>
  );
}
