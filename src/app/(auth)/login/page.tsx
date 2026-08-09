import { AuthForm } from "@/components/life-admin/auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-md border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use your Life Admin account to continue.</p>
        <div className="mt-6"><AuthForm mode="login" /></div>
      </div>
    </main>
  );
}
