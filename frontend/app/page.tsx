import Image from "next/image"

import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[3fr_2fr]">
        <div className="relative h-full min-h-[42vh] md:min-h-screen">
          <Image
            src="/hero.svg"
            alt="Soft gradient hero area with a light dotted grid pattern. Replace with your product image."
            fill
            className="object-cover"
            priority
            sizes="(min-width: 768px) 60vw, 100vw"
            unoptimized
          />
        </div>
        <div className="flex h-full min-h-0 flex-col justify-center gap-5 border-t-2 border-dotted border-border px-6 py-10 md:min-h-screen md:border-t-0 md:border-l-2 md:px-10 md:py-12 lg:px-16">
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
    </main>
  )
}
