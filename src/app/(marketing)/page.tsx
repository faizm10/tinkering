import type { Metadata } from "next";
import Link from "next/link";

import { Capabilities } from "@/components/marketing/capabilities";
import { HeroDemo } from "@/components/marketing/hero-demo";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ProblemTransform } from "@/components/marketing/problem-transform";
import { ProductShowcase } from "@/components/marketing/product-showcase";
import { Reveal } from "@/components/marketing/reveal";
import { TrustSection } from "@/components/marketing/trust-section";
import { UseCaseSwitcher } from "@/components/marketing/use-case-switcher";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Life Admin — the AI operating system for everything outside of work",
  description:
    "Describe what’s happening. Life Admin turns it into tasks, deadlines, reminders and follow-ups, then keeps everything organized until it’s done.",
};

/** Capabilities the product genuinely has — not logos, metrics or customers. */
const proofPoints = [
  { title: "Structured AI plans", detail: "One sentence in, an organized life event out." },
  { title: "Human approval", detail: "Nothing is saved until you say so." },
  { title: "Deadline tracking", detail: "Dates read in your timezone." },
  { title: "Follow-up management", detail: "Every open thread gets a chase date." },
  { title: "Private workspaces", detail: "Your plans are yours alone." },
];

export default function Home() {
  return (
    <>
      {/* Hero ------------------------------------------------------------- */}
      <section className="mx-auto max-w-[1200px] px-5 pb-14 pt-10 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
          <Reveal className="lg:pt-6">
            <p className="type-label">AI for personal operations</p>
            <h1 className="type-display-hero mt-4 text-balance">
              Your life has loose ends. Life Admin keeps track of them.
            </h1>
            <p className="type-body mt-6 max-w-lg text-lg leading-relaxed text-body">
              Describe what’s happening. Life Admin turns it into tasks, deadlines, reminders and
              follow-ups — then keeps everything organized until it’s done.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">Get started</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>

            <p className="type-meta mt-5">
              Nothing is added or acted on without your approval.
            </p>
          </Reveal>

          <Reveal delay={0.08} className="min-w-0">
            <HeroDemo />
          </Reveal>
        </div>
      </section>

      {/* Product proof band ----------------------------------------------- */}
      <section aria-label="What Life Admin does" className="border-y border-hairline">
        <ul className="mx-auto grid max-w-[1200px] divide-y divide-hairline px-5 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:px-8">
          {proofPoints.map((point) => (
            <li
              key={point.title}
              className="py-5 sm:border-b sm:border-hairline lg:border-b-0 lg:border-r lg:border-hairline lg:px-5 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
            >
              <p className="type-card-title">{point.title}</p>
              <p className="type-meta mt-1">{point.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Problem ----------------------------------------------------------- */}
      <section id="product" className="scroll-mt-20 border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
          <Reveal className="max-w-2xl">
            <h2 className="type-display-lg text-balance">
              Life admin rarely arrives as a neat checklist.
            </h2>
            <p className="type-body mt-4 text-body">
              It arrives through receipts, emails, appointments, purchases, travel plans and
              conversations. Life Admin turns those loose details into a system you can actually
              follow.
            </p>
          </Reveal>

          <div className="mt-12">
            <ProblemTransform />
          </div>
        </div>
      </section>

      {/* How it works ------------------------------------------------------ */}
      <section id="how-it-works" className="scroll-mt-20 border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
          <Reveal className="max-w-2xl">
            <p className="type-label">How it works</p>
            <h2 className="type-display-lg mt-3 text-balance">
              Three steps, and the second one is yours.
            </h2>
          </Reveal>

          <div className="mt-10">
            <HowItWorks />
          </div>
        </div>
      </section>

      {/* Capabilities ------------------------------------------------------ */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
          <Reveal className="max-w-2xl">
            <p className="type-label">Capabilities</p>
            <h2 className="type-display-lg mt-3 text-balance">
              Built for the work that has no project plan.
            </h2>
          </Reveal>

          <div className="mt-10">
            <Capabilities />
          </div>
        </div>
      </section>

      {/* Use cases --------------------------------------------------------- */}
      <section id="use-cases" className="scroll-mt-20 border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
          <Reveal className="max-w-2xl">
            <p className="type-label">Use cases</p>
            <h2 className="type-display-lg mt-3 text-balance">
              Pick a situation. See the plan it becomes.
            </h2>
          </Reveal>

          <div className="mt-10">
            <UseCaseSwitcher />
          </div>
        </div>
      </section>

      {/* Approval and control ---------------------------------------------- */}
      <section id="security" className="scroll-mt-20 border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
          <Reveal className="max-w-2xl">
            <p className="type-label">Approval and control</p>
            <h2 className="type-display-lg mt-3 text-balance">AI organizes. You stay in control.</h2>
            <p className="type-body mt-4 text-body">
              The agent drafts. You decide what is real. Every plan arrives as an editable proposal
              and waits.
            </p>
          </Reveal>

          <div className="mt-12">
            <TrustSection />
          </div>
        </div>
      </section>

      {/* Product showcase --------------------------------------------------- */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
          <Reveal className="max-w-2xl">
            <p className="type-label">The workspace</p>
            <h2 className="type-display-lg mt-3 text-balance">
              Everything in one place, once it’s approved.
            </h2>
            <p className="type-body mt-4 text-body">
              What is due today, what is coming, what someone else still owes you, and which plans
              are waiting for review.
            </p>
          </Reveal>

          <Reveal delay={0.06} className="mt-10">
            <ProductShowcase />
          </Reveal>
        </div>
      </section>

      {/* Final CTA ----------------------------------------------------------- */}
      <section>
        <div className="mx-auto max-w-[1200px] px-5 py-20 lg:px-8 lg:py-24">
          <Reveal className="max-w-2xl">
            <h2 className="type-display-lg text-balance">
              Stop carrying every loose end in your head.
            </h2>
            <p className="type-body mt-4 text-body">
              Tell Life Admin what’s happening and turn it into a plan you can actually complete.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="/register">Get started</Link>
              </Button>
              <Button asChild variant="link" size="lg">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
