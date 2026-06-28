import { and, eq, isNull } from "drizzle-orm";
import { getDatabase, hasDatabase } from "@/db";
import {
  analyticsProjects,
  dashboardAccounts,
  githubInstallations,
  repositories,
  trackingKeys,
} from "@/db/schema";
import { createTrackingKey, hashValue } from "./tracking";

export async function getRouteUserId() {
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return userId;
}

export async function listUserRepositories(clerkUserId: string) {
  if (!hasDatabase()) return [];
  const db = getDatabase();
  return db
    .select({
      id: repositories.id,
      name: repositories.name,
      fullName: repositories.fullName,
      private: repositories.private,
      archived: repositories.archived,
      selected: repositories.selected,
    })
    .from(repositories)
    .innerJoin(githubInstallations, eq(githubInstallations.id, repositories.installationId))
    .innerJoin(dashboardAccounts, eq(dashboardAccounts.id, githubInstallations.accountId))
    .where(eq(dashboardAccounts.clerkUserId, clerkUserId))
    .orderBy(repositories.fullName);
}

export async function findOwnedRepository(clerkUserId: string, slugOrFullName: string) {
  const db = getDatabase();
  const [repository] = await db
    .select({
      id: repositories.id,
      name: repositories.name,
      fullName: repositories.fullName,
      projectId: analyticsProjects.id,
    })
    .from(repositories)
    .innerJoin(githubInstallations, eq(githubInstallations.id, repositories.installationId))
    .innerJoin(dashboardAccounts, eq(dashboardAccounts.id, githubInstallations.accountId))
    .leftJoin(analyticsProjects, eq(analyticsProjects.repositoryId, repositories.id))
    .where(
      and(
        eq(dashboardAccounts.clerkUserId, clerkUserId),
        slugOrFullName.includes("/")
          ? eq(repositories.fullName, slugOrFullName)
          : eq(repositories.name, slugOrFullName),
      ),
    )
    .limit(1);
  return repository ?? null;
}

export async function createAnalyticsProject({
  clerkUserId,
  repositoryFullName,
  allowedOrigins,
}: {
  clerkUserId: string;
  repositoryFullName: string;
  allowedOrigins: string[];
}) {
  if (!hasDatabase()) {
    return {
      repository: repositoryFullName,
      publicKey: "rp_pub_demo_project",
      secretKey: "rp_sec_demo_project",
    };
  }

  const repository = await findOwnedRepository(clerkUserId, repositoryFullName);
  if (!repository) throw new Error("repository_not_found");

  const db = getDatabase();
  const [project] = await db
    .insert(analyticsProjects)
    .values({
      repositoryId: repository.id,
      name: repository.name,
      allowedOrigins,
    })
    .onConflictDoUpdate({
      target: analyticsProjects.repositoryId,
      set: { allowedOrigins, updatedAt: new Date() },
    })
    .returning({ id: analyticsProjects.id });

  await db
    .update(repositories)
    .set({ selected: true, updatedAt: new Date() })
    .where(eq(repositories.id, repository.id));

  const publicKey = createTrackingKey("public", repository.name);
  const secretKey = createTrackingKey("secret", repository.name);
  await db.insert(trackingKeys).values([
    {
      projectId: project.id,
      prefix: publicKey.slice(0, 24),
      keyHash: hashValue(publicKey),
      kind: "public",
    },
    {
      projectId: project.id,
      prefix: secretKey.slice(0, 24),
      keyHash: hashValue(secretKey),
      kind: "secret",
    },
  ]);

  return { repository: repository.fullName, publicKey, secretKey };
}

export async function rotateProjectKey({
  clerkUserId,
  repositorySlug,
  kind,
}: {
  clerkUserId: string;
  repositorySlug: string;
  kind: "public" | "secret";
}) {
  if (!hasDatabase()) return createTrackingKey(kind, repositorySlug);
  const repository = await findOwnedRepository(clerkUserId, repositorySlug);
  if (!repository?.projectId) throw new Error("project_not_found");

  const db = getDatabase();
  const now = new Date();
  await db
    .update(trackingKeys)
    .set({ revokedAt: now, updatedAt: now })
    .where(
      and(
        eq(trackingKeys.projectId, repository.projectId),
        eq(trackingKeys.kind, kind),
        isNull(trackingKeys.revokedAt),
      ),
    );

  const key = createTrackingKey(kind, repository.name);
  await db.insert(trackingKeys).values({
    projectId: repository.projectId,
    prefix: key.slice(0, 24),
    keyHash: hashValue(key),
    kind,
  });
  return key;
}

export async function getProjectInstallSettings(clerkUserId: string, repositorySlug: string) {
  if (!hasDatabase()) {
    return {
      allowedOrigins: ["http://localhost:3000"],
      publicKeyPrefix: `rp_pub_${repositorySlug}`,
    };
  }

  const repository = await findOwnedRepository(clerkUserId, repositorySlug);
  if (!repository?.projectId) return null;

  const db = getDatabase();
  const [project] = await db
    .select({ allowedOrigins: analyticsProjects.allowedOrigins })
    .from(analyticsProjects)
    .where(eq(analyticsProjects.id, repository.projectId))
    .limit(1);

  const [publicKey] = await db
    .select({ prefix: trackingKeys.prefix })
    .from(trackingKeys)
    .where(
      and(
        eq(trackingKeys.projectId, repository.projectId),
        eq(trackingKeys.kind, "public"),
        isNull(trackingKeys.revokedAt),
      ),
    )
    .limit(1);

  return {
    allowedOrigins: project?.allowedOrigins ?? [],
    publicKeyPrefix: publicKey?.prefix ?? `rp_pub_${repository.name}`,
  };
}

export async function updateProjectOrigins({
  clerkUserId,
  repositorySlug,
  allowedOrigins,
}: {
  clerkUserId: string;
  repositorySlug: string;
  allowedOrigins: string[];
}) {
  if (!hasDatabase()) return;
  const repository = await findOwnedRepository(clerkUserId, repositorySlug);
  if (!repository?.projectId) throw new Error("project_not_found");
  const db = getDatabase();
  await db
    .update(analyticsProjects)
    .set({ allowedOrigins, updatedAt: new Date() })
    .where(eq(analyticsProjects.id, repository.projectId));
}

export async function deleteProjectData(clerkUserId: string, repositorySlug: string) {
  if (!hasDatabase()) return;
  const repository = await findOwnedRepository(clerkUserId, repositorySlug);
  if (!repository?.projectId) throw new Error("project_not_found");
  const db = getDatabase();
  await db.delete(analyticsProjects).where(eq(analyticsProjects.id, repository.projectId));
  await db
    .update(repositories)
    .set({ selected: false, updatedAt: new Date() })
    .where(eq(repositories.id, repository.id));
}
