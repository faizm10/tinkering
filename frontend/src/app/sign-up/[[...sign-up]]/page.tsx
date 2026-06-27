import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clerkConfigured } from "@/lib/auth";

export default function SignUpPage() {
  return (
    <main className="metric-grid flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <Logo />
      {clerkConfigured ? (
        <SignUp />
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication is not configured</CardTitle>
            <CardDescription>
              Add Clerk keys to `.env.local` for GitHub sign-up, or continue with the local demo workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">Continue in demo mode</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
