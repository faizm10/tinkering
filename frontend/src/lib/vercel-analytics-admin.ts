import { eq } from "drizzle-orm";
import { getDatabase, hasDatabase } from "@/db";
import { vercelAnalyticsConnections } from "@/db/schema";
import { decryptJson, encryptJson } from "./crypto";
import { findOwnedRepository } from "./project-admin";

export async function getVercelAnalyticsConnection(clerkUserId: string, repositorySlug: string) {
  if (!hasDatabase()) return null;
  const repository = await findOwnedRepository(clerkUserId, repositorySlug);
  if (!repository?.projectId) return null;
  const db = getDatabase();
  const [connection] = await db
    .select({
      id: vercelAnalyticsConnections.id,
      vercelProjectId: vercelAnalyticsConnections.vercelProjectId,
      vercelTeamId: vercelAnalyticsConnections.vercelTeamId,
      status: vercelAnalyticsConnections.status,
      lastSyncedAt: vercelAnalyticsConnections.lastSyncedAt,
      lastError: vercelAnalyticsConnections.lastError,
    })
    .from(vercelAnalyticsConnections)
    .where(eq(vercelAnalyticsConnections.projectId, repository.projectId))
    .limit(1);
  return connection ?? null;
}

export async function connectVercelAnalytics({
  clerkUserId,
  repositorySlug,
  vercelProjectId,
  vercelTeamId,
  token,
}: {
  clerkUserId: string;
  repositorySlug: string;
  vercelProjectId: string;
  vercelTeamId?: string;
  token: string;
}) {
  if (!hasDatabase()) {
    return {
      id: "demo-vercel",
      vercelProjectId,
      vercelTeamId: vercelTeamId ?? null,
      status: "connected",
      lastSyncedAt: new Date(),
      lastError: null,
    };
  }

  // Validate credentials — look up the project to confirm token works
  const projectUrl = vercelTeamId
    ? `https://api.vercel.com/v9/projects/${vercelProjectId}?teamId=${vercelTeamId}`
    : `https://api.vercel.com/v9/projects/${vercelProjectId}`;
  const testResponse = await fetch(projectUrl, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!testResponse.ok) {
    throw new Error("vercel_credentials_invalid");
  }

  const repository = await findOwnedRepository(clerkUserId, repositorySlug);
  if (!repository?.projectId) throw new Error("analytics_project_not_found");

  const db = getDatabase();
  const [connection] = await db
    .insert(vercelAnalyticsConnections)
    .values({
      projectId: repository.projectId,
      vercelProjectId,
      vercelTeamId: vercelTeamId ?? null,
      encryptedToken: encryptJson({ token }),
      status: "connected",
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: vercelAnalyticsConnections.projectId,
      set: {
        vercelProjectId,
        vercelTeamId: vercelTeamId ?? null,
        encryptedToken: encryptJson({ token }),
        status: "connected",
        lastError: null,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning({
      id: vercelAnalyticsConnections.id,
      vercelProjectId: vercelAnalyticsConnections.vercelProjectId,
      vercelTeamId: vercelAnalyticsConnections.vercelTeamId,
      status: vercelAnalyticsConnections.status,
      lastSyncedAt: vercelAnalyticsConnections.lastSyncedAt,
      lastError: vercelAnalyticsConnections.lastError,
    });

  return connection;
}

export async function disconnectVercelAnalytics(clerkUserId: string, repositorySlug: string) {
  if (!hasDatabase()) return;
  const repository = await findOwnedRepository(clerkUserId, repositorySlug);
  if (!repository?.projectId) throw new Error("analytics_project_not_found");
  const db = getDatabase();
  await db
    .delete(vercelAnalyticsConnections)
    .where(eq(vercelAnalyticsConnections.projectId, repository.projectId));
}

export async function getVercelToken(connectionId: string) {
  const db = getDatabase();
  const [row] = await db
    .select({ encryptedToken: vercelAnalyticsConnections.encryptedToken })
    .from(vercelAnalyticsConnections)
    .where(eq(vercelAnalyticsConnections.id, connectionId))
    .limit(1);
  if (!row) throw new Error("vercel_connection_not_found");
  return decryptJson<{ token: string }>(row.encryptedToken).token;
}
