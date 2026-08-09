import { randomUUID } from "crypto";

import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

config({ path: ".env.local", quiet: true });

const runNeonAuthDbTest = process.env.RUN_NEON_AUTH_DB_TEST === "1";
const describeIf = runNeonAuthDbTest ? describe : describe.skip;

describeIf("Neon Auth database ownership", () => {
  const createdEventIds: string[] = [];

  afterAll(async () => {
    if (!createdEventIds.length) return;
    const { db } = await import("@/db");
    const { lifeEvents } = await import("@/db/schema");

    for (const id of createdEventIds) {
      await db.delete(lifeEvents).where(eq(lifeEvents.id, id));
    }
  });

  it("creates and reads a record owned by a Neon-authenticated user id", async () => {
    const [{ createAuthClient }, { db }, { lifeEvents }] = await Promise.all([
      import("@neondatabase/auth"),
      import("@/db"),
      import("@/db/schema"),
    ]);

    const auth = createAuthClient(process.env.NEON_AUTH_BASE_URL!);
    const suffix = `${Date.now()}-${randomUUID()}`;
    const email = `sonae-db-${suffix}@example.com`;
    const password = `Sonae-${randomUUID()}-test-password`;
    const signUp = await auth.signUp.email({
      name: "Sonae DB Test",
      email,
      password,
      fetchOptions: {
        headers: {
          origin: process.env.NEON_AUTH_TEST_ORIGIN || "http://localhost:3000",
        },
      },
    });

    expect(signUp.error).toBeFalsy();

    const data = signUp.data as {
      user?: { id?: string };
      session?: { userId?: string; user?: { id?: string } };
    } | null;
    const userId = data?.user?.id ?? data?.session?.user?.id ?? data?.session?.userId;
    expect(userId).toEqual(expect.any(String));

    const [created] = await db
      .insert(lifeEvents)
      .values({
        userId: userId!,
        title: "Authenticated DB smoke test",
        description: "Created by a Neon Auth integration test.",
        category: "test",
      })
      .returning({ id: lifeEvents.id });

    createdEventIds.push(created.id);

    const [readBack] = await db
      .select({ id: lifeEvents.id, userId: lifeEvents.userId, title: lifeEvents.title })
      .from(lifeEvents)
      .where(eq(lifeEvents.id, created.id))
      .limit(1);

    expect(readBack).toEqual({
      id: created.id,
      userId,
      title: "Authenticated DB smoke test",
    });
  });
});
