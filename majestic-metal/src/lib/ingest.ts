import { and, eq, isNull } from "drizzle-orm";
import { getDatabase, hasDatabase } from "@/db";
import {
  analyticsProjects,
  events,
  ingestionBatches,
  productUsers,
  sessions,
  trackingKeys,
  visitors,
} from "@/db/schema";
import type { IngestionEvent } from "./ingestion-schema";
import { hashValue, sanitizeTraits } from "./tracking";

export type ResolvedProject = {
  id: string;
  keyId: string;
  keyKind: "public" | "secret";
  allowedOrigins: string[];
};

type IngestExecutor = Pick<ReturnType<typeof getDatabase>, "insert" | "update">;

export async function resolveProjectKey(rawKey: string): Promise<ResolvedProject | null> {
  if (!hasDatabase()) {
    if (rawKey === "rp_pub_demo_project" || rawKey === "rp_sec_demo_project") {
      return {
        id: "demo-project",
        keyId: "demo-key",
        keyKind: rawKey.startsWith("rp_sec") ? "secret" : "public",
        allowedOrigins: ["http://localhost:3000", "http://localhost:4321"],
      };
    }
    return null;
  }

  const db = getDatabase();
  const [row] = await db
    .select({
      id: analyticsProjects.id,
      keyId: trackingKeys.id,
      kind: trackingKeys.kind,
      allowedOrigins: analyticsProjects.allowedOrigins,
    })
    .from(trackingKeys)
    .innerJoin(analyticsProjects, eq(analyticsProjects.id, trackingKeys.projectId))
    .where(and(eq(trackingKeys.keyHash, hashValue(rawKey)), isNull(trackingKeys.revokedAt)))
    .limit(1);

  if (!row || (row.kind !== "public" && row.kind !== "secret")) return null;
  return {
    id: row.id,
    keyId: row.keyId,
    keyKind: row.kind,
    allowedOrigins: row.allowedOrigins,
  };
}

export async function batchAlreadyProcessed(projectId: string, idempotencyKey: string) {
  if (!hasDatabase()) return false;
  const db = getDatabase();
  const [row] = await db
    .select({ id: ingestionBatches.id })
    .from(ingestionBatches)
    .where(
      and(
        eq(ingestionBatches.projectId, projectId),
        eq(ingestionBatches.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);
  return Boolean(row);
}

async function persistEvent(
  tx: IngestExecutor,
  projectId: string,
  event: IngestionEvent,
  userAgent: string | null,
) {
  const occurredAt = new Date(event.timestamp);
  const now = new Date();
  const anonymousIdHash = hashValue(event.anonymousId);

  const [visitor] = await tx
    .insert(visitors)
    .values({
      projectId,
      anonymousIdHash,
      firstSeenAt: occurredAt,
      lastSeenAt: occurredAt,
    })
    .onConflictDoUpdate({
      target: [visitors.projectId, visitors.anonymousIdHash],
      set: { lastSeenAt: occurredAt, updatedAt: now },
    })
    .returning({ id: visitors.id });

  let productUserId: string | null = null;
  if (event.userId) {
    const externalIdHash = hashValue(event.userId);
    const [productUser] = await tx
      .insert(productUsers)
      .values({
        projectId,
        externalIdHash,
        displayId: event.userId,
        traits: sanitizeTraits(event.traits),
        firstSeenAt: occurredAt,
        lastSeenAt: occurredAt,
      })
      .onConflictDoUpdate({
        target: [productUsers.projectId, productUsers.externalIdHash],
        set: {
          displayId: event.userId,
          traits: sanitizeTraits(event.traits),
          lastSeenAt: occurredAt,
          updatedAt: now,
        },
      })
      .returning({ id: productUsers.id });
    productUserId = productUser.id;
  }

  const [session] = await tx
    .insert(sessions)
    .values({
      projectId,
      visitorId: visitor.id,
      productUserId,
      clientSessionId: event.sessionId,
      startedAt: occurredAt,
      lastSeenAt: occurredAt,
      referrer: event.referrer,
      landingPath: event.path,
      utm: event.utm ?? {},
    })
    .onConflictDoUpdate({
      target: [sessions.projectId, sessions.clientSessionId],
      set: {
        lastSeenAt: occurredAt,
        productUserId,
        updatedAt: now,
      },
    })
    .returning({ id: sessions.id });

  if (productUserId) {
    await tx
      .update(events)
      .set({ productUserId, updatedAt: now })
      .where(
        and(
          eq(events.projectId, projectId),
          eq(events.visitorId, visitor.id),
          isNull(events.productUserId),
        ),
      );
  }

  const inserted = await tx
    .insert(events)
    .values({
      projectId,
      visitorId: visitor.id,
      productUserId,
      sessionId: session.id,
      clientEventId: event.id,
      name: event.name,
      occurredAt,
      path: event.path,
      referrer: event.referrer,
      properties: event.properties,
      userAgent,
    })
    .onConflictDoNothing({
      target: [events.projectId, events.clientEventId, events.occurredAt],
    })
    .returning({ id: events.id });

  return inserted.length === 1;
}

export async function persistBatch({
  project,
  batch,
  idempotencyKey,
  userAgent,
}: {
  project: ResolvedProject;
  batch: IngestionEvent[];
  idempotencyKey: string;
  userAgent: string | null;
}) {
  if (!hasDatabase()) {
    return { accepted: batch.length, duplicates: 0 };
  }

  const db = getDatabase();
  let accepted = 0;
  let duplicates = 0;

  await db.transaction(async (tx) => {
    for (const event of batch) {
      const inserted = await persistEvent(tx, project.id, event, userAgent);
      if (inserted) accepted += 1;
      else duplicates += 1;
    }

    await tx.insert(ingestionBatches).values({
      projectId: project.id,
      idempotencyKey,
      acceptedEvents: accepted,
    });

    await tx
      .update(trackingKeys)
      .set({ lastUsedAt: new Date(), updatedAt: new Date() })
      .where(eq(trackingKeys.id, project.keyId));
  });

  return { accepted, duplicates };
}
