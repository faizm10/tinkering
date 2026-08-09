import { AuthForm } from "@/components/sonae/auth-form";
import { Wordmark } from "@/components/layout/wordmark";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-5 py-12">
      <div className="w-full max-w-sm">
        <Wordmark href="/" />
        <h1 className="type-display-lg mt-8">Sign in</h1>
        <p className="type-body mt-1.5 text-body">Pick up where your plans left off.</p>
        <div className="mt-7">
          <AuthForm mode="login" />
        </div>
      </div>
    </main>
  );
}
