import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-sm text-primary">404</p>
      <h1 className="mt-3 text-3xl font-semibold">Repository not found</h1>
      <p className="mt-2 text-muted-foreground">It may not be installed or selected for analytics.</p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Return to portfolio</Link>
      </Button>
    </main>
  );
}
