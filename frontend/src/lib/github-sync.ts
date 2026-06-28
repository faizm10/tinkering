import { eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { dashboardAccounts, githubInstallations, repositories } from "@/db/schema";
import { getInstallation, listAppInstallations, listInstallationRepositories } from "./github";

export async function syncInstallation(accountId: string, installationId: number) {
  const db = getDatabase();
  const [installation, githubRepositories] = await Promise.all([
    getInstallation(installationId),
    listInstallationRepositories(installationId),
  ]);

  const [record] = await db
    .insert(githubInstallations)
    .values({
      accountId,
      installationId,
      githubAccountId: installation.account.id,
      githubLogin: installation.account.login,
      accountType: installation.account.type,
      suspendedAt: installation.suspended_at ? new Date(installation.suspended_at) : null,
    })
    .onConflictDoUpdate({
      target: githubInstallations.installationId,
      set: {
        accountId,
        githubLogin: installation.account.login,
        accountType: installation.account.type,
        suspendedAt: installation.suspended_at ? new Date(installation.suspended_at) : null,
        updatedAt: new Date(),
      },
    })
    .returning({ id: githubInstallations.id });

  for (const repository of githubRepositories) {
    await db
      .insert(repositories)
      .values({
        installationId: record.id,
        githubRepositoryId: repository.id,
        owner: repository.owner.login,
        name: repository.name,
        fullName: repository.full_name,
        defaultBranch: repository.default_branch,
        private: repository.private,
        archived: repository.archived,
      })
      .onConflictDoUpdate({
        target: repositories.githubRepositoryId,
        set: {
          installationId: record.id,
          owner: repository.owner.login,
          name: repository.name,
          fullName: repository.full_name,
          defaultBranch: repository.default_branch,
          private: repository.private,
          archived: repository.archived,
          updatedAt: new Date(),
        },
      });
  }

  return { installation, repositories: githubRepositories };
}

/**
 * Discovers GitHub App installations that belong to the given GitHub login and
 * links them to the dashboard account. Matching by the OAuth-verified GitHub
 * login (from Clerk) proves the user owns the installation, so this is safe to
 * run without the install-state cookie — it works no matter how the user
 * installed the app (in-app button or directly from GitHub settings).
 */
export async function syncInstallationsForGitHubLogin(clerkUserId: string, githubLogin: string) {
  const installations = await listAppInstallations();
  const matches = installations.filter(
    (installation) => installation.account?.login?.toLowerCase() === githubLogin.toLowerCase(),
  );
  if (matches.length === 0) return { linked: 0 };

  const account = await ensureDashboardAccount(clerkUserId, githubLogin);
  for (const installation of matches) {
    await syncInstallation(account.id, installation.id);
  }
  return { linked: matches.length };
}

export async function ensureDashboardAccount(clerkUserId: string, githubLogin?: string) {
  const db = getDatabase();
  const [account] = await db
    .insert(dashboardAccounts)
    .values({ clerkUserId, githubLogin })
    .onConflictDoUpdate({
      target: dashboardAccounts.clerkUserId,
      set: { githubLogin, updatedAt: new Date() },
    })
    .returning({ id: dashboardAccounts.id });
  return account;
}

export async function deleteInstallation(installationId: number) {
  const db = getDatabase();
  await db
    .delete(githubInstallations)
    .where(eq(githubInstallations.installationId, installationId));
}

export async function resyncExistingInstallation(installationId: number) {
  const db = getDatabase();
  const [existing] = await db
    .select({ accountId: githubInstallations.accountId })
    .from(githubInstallations)
    .where(eq(githubInstallations.installationId, installationId))
    .limit(1);
  if (!existing) throw new Error("Installation is not linked to a dashboard account");
  return syncInstallation(existing.accountId, installationId);
}
