export default function AssistantLoading() {
  return (
    <div className="grid min-h-[calc(100vh-8rem)] gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="border border-hairline bg-surface">
        <div className="border-b border-hairline bg-canvas-soft px-5 py-4">
          <div className="h-5 w-28 animate-pulse rounded-[var(--radius-tag)] bg-hairline-soft" />
          <div className="mt-2 h-3 w-64 animate-pulse rounded-[var(--radius-tag)] bg-hairline-soft" />
        </div>
        <div className="space-y-4 p-5">
          <div className="h-20 animate-pulse rounded-[var(--radius-control)] bg-hairline-soft" />
          <div className="ml-auto h-14 w-2/3 animate-pulse rounded-[var(--radius-control)] bg-hairline-soft" />
        </div>
      </div>
      <div className="hidden space-y-5 xl:block">
        {[0, 1, 2].map((item) => (
          <div key={item} className="border-t border-hairline pt-3">
            <div className="h-4 w-20 animate-pulse rounded-[var(--radius-tag)] bg-hairline-soft" />
            <div className="mt-3 h-12 animate-pulse rounded-[var(--radius-control)] bg-hairline-soft" />
          </div>
        ))}
      </div>
    </div>
  );
}
