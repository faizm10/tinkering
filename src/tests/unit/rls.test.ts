import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("application migration ownership assumptions", () => {
  it("keeps auth managed by Neon and stores ownership on app tables", () => {
    const migration = readFileSync("drizzle/0000_sonae_app_tables.sql", "utf8");

    expect(migration).not.toContain('CREATE TABLE "user"');
    expect(migration).not.toContain('CREATE TABLE "session"');
    expect(migration).not.toContain('CREATE TABLE "account"');
    expect(migration).not.toContain('CREATE TABLE "verification"');
    expect(migration).not.toContain("neon_auth");
    expect(migration).toContain('"user_id" text NOT NULL');
    expect(migration).toContain('CREATE INDEX "tasks_user_id_idx"');
    expect(migration).toContain('CREATE INDEX "agent_proposals_user_id_idx"');
  });
});
