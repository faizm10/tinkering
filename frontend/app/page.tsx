import Image from "next/image"

import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <main className="relative min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center">
        <div className="w-full rounded-xl border-2 border-dotted border-border p-6 md:p-10">
          <div className="grid grid-cols-1 gap-0 md:grid-cols-[3fr_2fr]">
            <div className="relative aspect-4/3 min-h-[200px] w-full overflow-hidden bg-muted md:min-h-[280px]">
              <Image
                src="/hero.svg"
                alt="Soft gradient hero area with a light dotted grid pattern. Replace with your product image."
                fill
                className="object-cover"
                priority
                sizes="(min-width: 768px) 42rem, 100vw"
                unoptimized
              />
            </div>
            <div className="flex flex-col justify-center gap-5 border-t border-dotted border-border px-0 pt-6 md:border-t-0 md:border-l md:px-8 md:pt-0 md:pb-0">
              <div className="space-y-3">
                <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                  Coming soon
                </p>
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                  A calmer place to build what&apos;s next.
                </h1>
                <p className="max-w-prose text-pretty text-muted-foreground md:text-base">
                  We&apos;re putting the finishing touches on something new. Leave
                  your email on the list, or just check back soon.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" size="lg">
                  Get updates
                </Button>
                <Button type="button" variant="outline" size="lg">
                  Learn more
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
