import { eq } from "drizzle-orm";
import { getDatabase, hasDatabase } from "@/db";
import { posthogConnections } from "@/db/schema";
import { decryptJson, encryptJson } from "./crypto";
import { findOwnedRepository } from "./project-admin";

export async function getPosthogConnection(clerkUserId: string, repositorySlug: string) {
  if (!hasDatabase()) return null;
  const repository = await findOwnedRepository(clerkUserId, repositorySlug);
  if (!repository?.projectId) return null;
  const db = getDatabase();
  const [connection] = await db
    .select({
      id: posthogConnections.id,
      host: posthogConnections.host,
      posthogProjectId: posthogConnections.posthogProjectId,
      status: posthogConnections.status,
      lastSyncedAt: posthogConnections.lastSyncedAt,
      lastError: posthogConnections.lastError,
    })
    .from(posthogConnections)
    .where(eq(posthogConnections.projectId, repository.projectId))
    .limit(1);
  return connection ?? null;
}

export async function connectPosthog({
  clerkUserId,
  repositorySlug,
  host,
  posthogProjectId,
  personalApiKey,
}: {
  clerkUserId: string;
  repositorySlug: string;
  host: string;
  posthogProjectId: string;
  personalApiKey: string;
}) {
  if (!hasDatabase()) {
    return {
      id: "demo-posthog",
      host,
      posthogProjectId,
      status: "connected",
      lastSyncedAt: new Date(),
      lastError: null,
    };
  }

  const normalizedHost = host.replace(/\/$/, "");

  // Validate the credentials with a lightweight API call
  const testResponse = await fetch(
    `${normalizedHost}/api/projects/${posthogProjectId}/`,
    { headers: { Authorization: `Bearer ${personalApiKey}` }, cache: "no-store" },
  );
  if (!testResponse.ok) {
    throw new Error("posthog_credentials_invalid");
  }

  const repository = await findOwnedRepository(clerkUserId, repositorySlug);
  if (!repository?.projectId) throw new Error("analytics_project_not_found");

  const db = getDatabase();
  const [connection] = await db
    .insert(posthogConnections)
    .values({
      projectId: repository.projectId,
      host: normalizedHost,
      posthogProjectId,
      encryptedPersonalApiKey: encryptJson({ key: personalApiKey }),
      status: "connected",
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: posthogConnections.projectId,
      set: {
        host: normalizedHost,
        posthogProjectId,
        encryptedPersonalApiKey: encryptJson({ key: personalApiKey }),
        status: "connected",
        lastError: null,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning({
      id: posthogConnections.id,
      host: posthogConnections.host,
      posthogProjectId: posthogConnections.posthogProjectId,
      status: posthogConnections.status,
      lastSyncedAt: posthogConnections.lastSyncedAt,
      lastError: posthogConnections.lastError,
    });

  return connection;
}

export async function disconnectPosthog(clerkUserId: string, repositorySlug: string) {
  if (!hasDatabase()) return;
  const repository = await findOwnedRepository(clerkUserId, repositorySlug);
  if (!repository?.projectId) throw new Error("analytics_project_not_found");
  const db = getDatabase();
  await db
    .delete(posthogConnections)
    .where(eq(posthogConnections.projectId, repository.projectId));
}

export async function getPosthogApiKey(connectionId: string) {
  const db = getDatabase();
  const [row] = await db
    .select({ encryptedPersonalApiKey: posthogConnections.encryptedPersonalApiKey })
    .from(posthogConnections)
    .where(eq(posthogConnections.id, connectionId))
    .limit(1);
  if (!row) throw new Error("posthog_connection_not_found");
  return decryptJson<{ key: string }>(row.encryptedPersonalApiKey).key;
}
