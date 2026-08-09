import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto grid min-h-[92vh] max-w-6xl gap-10 px-6 py-8 md:grid-cols-[1fr_420px] md:items-center lg:px-8">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Approval-first personal planning
          </div>
          <div className="max-w-3xl space-y-5">
            <h1 className="text-5xl font-semibold leading-[1.03] text-foreground md:text-7xl">
              Life Admin
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Describe what is happening in your life. Life Admin turns it into an organized event with tasks,
              deadlines, reminders, and follow-ups that you review before anything is saved.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Open dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>
        <div className="border border-border bg-card p-5 shadow-sm">
          <div className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground">Situation</p>
              <p className="mt-2 text-lg font-medium">I’m moving to a new house on September 1.</p>
            </div>
            <div className="space-y-3 border-t border-border pt-5">
              {["Update banking address", "Transfer internet service", "Change delivery addresses"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 border-t border-border pt-5 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              Waiting items and reminders stay pending until approved.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
