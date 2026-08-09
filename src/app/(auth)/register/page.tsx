import { AuthForm } from "@/components/sonae/auth-form";
import { Wordmark } from "@/components/layout/wordmark";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-5 py-12">
      <div className="w-full max-w-sm">
        <Wordmark href="/" />
        <h1 className="type-display-lg mt-8">Create account</h1>
        <p className="type-body mt-1.5 text-body">Set up your private Sonae workspace.</p>
        <div className="mt-7">
          <AuthForm mode="register" />
        </div>
      </div>
    </main>
  );
}
