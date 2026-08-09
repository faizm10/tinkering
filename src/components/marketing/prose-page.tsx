/** Shared shell for the short text pages linked from the footer. */
export function ProsePage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[720px] px-5 py-16 lg:px-8 lg:py-20">
      <p className="type-label">{eyebrow}</p>
      <h1 className="type-display-lg mt-3 text-balance">{title}</h1>
      <p className="type-body mt-4 text-lg leading-relaxed text-body">{intro}</p>
      <div className="mt-10 space-y-8 border-t border-hairline pt-10">{children}</div>
    </div>
  );
}

export function ProseSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h2 className="type-section">{heading}</h2>
      <div className="type-body space-y-2.5 text-body">{children}</div>
    </section>
  );
}
