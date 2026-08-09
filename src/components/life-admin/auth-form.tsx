"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("demo@lifeadmin.local");
  const [password, setPassword] = useState("password1234");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      if (mode === "register") {
        const result = await authClient.signUp.email({ name, email, password });
        if (result.error) {
          setError(result.error.message ?? "Could not create account.");
          return;
        }
      } else if (process.env.NEXT_PUBLIC_DEMO_AUTH !== "true") {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message ?? "Could not sign in.");
          return;
        }
      }
      router.push(mode === "register" ? "/onboarding" : "/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" ? (
        <label className="block text-sm font-medium">
          Name
          <input className="mt-2 w-full border border-input bg-background p-3" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
      ) : null}
      <label className="block text-sm font-medium">
        Email
        <input className="mt-2 w-full border border-input bg-background p-3" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input className="mt-2 w-full border border-input bg-background p-3" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="w-full" disabled={pending}>{mode === "register" ? "Create account" : "Sign in"}</Button>
      <p className="text-sm text-muted-foreground">
        {mode === "register" ? "Already have an account? " : "Need an account? "}
        <Link className="font-medium text-foreground" href={mode === "register" ? "/login" : "/register"}>
          {mode === "register" ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
