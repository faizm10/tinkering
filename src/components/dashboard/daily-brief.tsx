import { format } from "date-fns";

/**
 * The greeting band: date, name, and one sentence of orientation generated
 * from the user's real tasks and waiting items.
 */
export function DailyBrief({ name, brief }: { name: string; brief: string }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <header className="space-y-2">
      <time dateTime={format(now, "yyyy-MM-dd")} className="type-mono text-muted">
        {format(now, "EEEE, MMMM d")}
      </time>
      <h1 className="type-page-title">
        {greeting}, {name}
      </h1>
      <p className="type-body max-w-2xl text-body">{brief}</p>
    </header>
  );
}
