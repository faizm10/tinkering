import Link from "next/link";
import { connection } from "next/server";

import { AuthForm } from "@/components/sonae/auth-form";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/wordmark";
import { getCurrentUser } from "@/lib/auth/session";

export default async function RegisterPage() {
  await connection();
  const user = await getCurrentUser();

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-5 py-12">
      <div className="w-full max-w-sm">
        <Wordmark href="/" />
        <h1 className="type-display-lg mt-8">Create account</h1>
        <p className="type-body mt-1.5 text-body">Set up your private Sonae workspace.</p>
        <div className="mt-7">
          {user ? (
            <div
              role="alert"
              className="rounded-[var(--radius-control)] border border-error/30 bg-error/5 p-4"
            >
              <p className="text-[0.9375rem] font-medium text-error">
                You are already signed in.
              </p>
              <p className="type-body mt-1.5 text-body">
                Sign out before creating another account. You are currently using {user.email}.
              </p>
              <Button asChild className="mt-5 w-full">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          ) : (
            <AuthForm mode="register" />
          )}
        </div>
      </div>
    </main>
  );
}
