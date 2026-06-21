import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const browserExample = `RepoPulse.init({
  projectKey: "rp_pub_your_project_key",
  endpoint: "https://your-dashboard.com/api/ingest",
  consent: true
})

RepoPulse.identify("your-opaque-user-id", {
  plan: "pro"
})

RepoPulse.track("project_created", {
  template: "nextjs"
})`;

const serverExample = `await fetch("https://your-dashboard.com/api/ingest", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "authorization": "Bearer rp_sec_your_server_key",
    "idempotency-key": crypto.randomUUID()
  },
  body: JSON.stringify({
    events: [{
      id: crypto.randomUUID(),
      name: "invoice_paid",
      anonymousId: "server",
      sessionId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: "your-opaque-user-id",
      properties: { amount: 4900, currency: "USD" }
    }]
  })
})`;

export default function DocsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <Logo />
        <Button asChild variant="ghost">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
        </Button>
      </div>
      <div className="mt-16 max-w-2xl">
        <p className="text-sm text-primary">Tracking SDK</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Instrument your product</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          The browser SDK automatically records sessions and page views. Use custom events for actions that
          represent product value.
        </p>
      </div>
      <div className="mt-10 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Browser SDK</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-secondary/60 p-5 font-mono text-xs leading-6 text-muted-foreground">
              {browserExample}
            </pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>HTTP batch API</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-secondary/60 p-5 font-mono text-xs leading-6 text-muted-foreground">
              {serverExample}
            </pre>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
