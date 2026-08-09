"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { authClient } from "@/lib/auth/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <form onSubmit={submit} className="space-y-5" noValidate={false}>
      {mode === "register" ? (
        <Field label="Name" htmlFor="auth-name">
          <Input
            id="auth-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </Field>
      ) : null}

      <Field label="Email" htmlFor="auth-email">
        <Input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </Field>

      <Field
        label="Password"
        htmlFor="auth-password"
        hint={mode === "register" ? "At least 8 characters." : undefined}
      >
        <Input
          id="auth-password"
          name="password"
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />
      </Field>

      {error ? (
        <p role="alert" className="text-[0.875rem] text-error">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? mode === "register"
            ? "Creating account…"
            : "Signing in…"
          : mode === "register"
            ? "Create account"
            : "Sign in"}
      </Button>

      <p className="type-meta">
        {mode === "register" ? "Already have an account? " : "Need an account? "}
        <Link
          className="text-ink underline decoration-hairline-strong underline-offset-2 hover:decoration-ink"
          href={mode === "register" ? "/login" : "/register"}
        >
          {mode === "register" ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
