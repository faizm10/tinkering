import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { clerkConfigured } from "@/lib/auth";
import { createGitHubInstallState } from "@/lib/github-state";

export async function GET(request: Request) {
  if (!clerkConfigured || !process.env.GITHUB_APP_SLUG) {
    return Response.redirect(new URL("/dashboard/onboarding?error=github_app_not_configured", request.url));
  }
  const { userId } = await auth();
  if (!userId) {
    return Response.redirect(new URL("/sign-in?redirect_url=/api/github/install", request.url));
  }

  const state = createGitHubInstallState(userId);
  const cookieStore = await cookies();
  cookieStore.set("github_install_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  const installUrl = new URL(
    `https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new`,
  );
  installUrl.searchParams.set("state", state);
  return Response.redirect(installUrl);
}
