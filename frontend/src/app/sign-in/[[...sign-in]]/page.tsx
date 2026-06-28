import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/logo";

export default function SignInPage() {
  return (
    <main className="metric-grid flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <Logo />
      <SignIn />
    </main>
  );
}
