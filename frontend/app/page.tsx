import Image from "next/image"

import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <main className="flex h-[100dvh] overflow-hidden flex-col bg-background text-foreground">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        aria-label="Hero"
        className="grid flex-1 min-h-0 grid-cols-1 grid-rows-[auto_auto_1fr] md:grid-cols-[3fr_auto_2fr] md:grid-rows-1 md:items-stretch"
      >
        {/* Left: image panel */}
        <div className="relative min-h-[42vh] md:col-start-1 md:row-start-1 md:h-full md:min-h-0">
          <Image
            src="/hero.png"
            alt="Soft gradient hero area with a light dotted grid pattern."
            fill
            className="object-cover"
            priority
            sizes="(min-width: 768px) 60vw, 100vw"
            unoptimized
          />
          {/* Bottom-left index tag */}
          <div className="absolute bottom-5 left-6 md:bottom-8 md:left-10 lg:left-16">
            <span className="font-mono text-[0.6rem] tracking-[0.3em] text-foreground/35 uppercase select-none">
              Studio / 2026
            </span>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full bg-border md:col-start-2 md:row-start-1 md:h-full md:w-px md:min-h-0"
          aria-hidden
        />

        {/* Right: copy + CTA */}
        <div className="flex min-h-0 flex-col justify-between gap-6 px-6 py-10 md:col-start-3 md:row-start-1 md:px-10 md:py-12 lg:px-16">
          {/* Top label */}
          <p className="font-mono text-[0.65rem] tracking-[0.25em] text-muted-foreground uppercase">
            Coming soon
          </p>

          {/* Main copy */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance leading-[1.08] md:text-[2.6rem] lg:text-5xl">
                currently tinkering something new
              </h1>
              <p className="max-w-[28ch] text-sm text-muted-foreground text-pretty leading-relaxed">
                stay tuned for more updates
              </p>
            </div>
          </div>

          {/* Bottom mark */}
          <p className="font-mono text-[0.6rem] tracking-[0.25em] text-foreground/25 uppercase select-none">
            Est. 2026
          </p>
        </div>
      </section>
    </main>
  )
}
