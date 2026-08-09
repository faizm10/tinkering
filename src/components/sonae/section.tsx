/**
 * A dashboard section is a heading, a rule, and content. Whitespace and the
 * hairline do the separating — no bordered container, so cards never end up
 * nested inside cards.
 */
export function Section({
  title,
  count,
  action,
  children,
  className,
  headingLevel: Heading = "h2",
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  return (
    <section className={className}>
      <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-2.5">
        <div className="flex items-baseline gap-2.5">
          <Heading className="type-section">{title}</Heading>
          {typeof count === "number" && count > 0 ? (
            <span className="type-mono text-muted" aria-hidden>
              {count}
            </span>
          ) : null}
        </div>
        {action}
      </div>
      <div className="pt-1">{children}</div>
    </section>
  );
}
