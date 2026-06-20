import type { TrendPoint } from "@/lib/demo-data";

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const width = 800;
  const height = 220;
  const padding = 18;
  const values = data.map((point) => point.users);
  const min = Math.min(...values) * 0.9;
  const max = Math.max(...values) * 1.05;
  const range = Math.max(max - min, 1);
  const points = data
    .map((point, index) => {
      const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((point.users - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const area = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[220px] w-full overflow-visible"
        role="img"
        aria-label="Active users over the last 30 days"
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            x2={width - padding}
            y1={height * ratio}
            y2={height * ratio}
            stroke="var(--border)"
            strokeDasharray="4 7"
          />
        ))}
        <polygon points={area} fill="url(#trend-fill)" />
        <polyline
          points={points}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-muted-foreground">
        {data.map((point, index) =>
          index % 2 === 0 || index === data.length - 1 ? (
            <span key={point.day}>{point.day}</span>
          ) : null,
        )}
      </div>
    </div>
  );
}
