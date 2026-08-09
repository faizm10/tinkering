import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("row level security migration assumptions", () => {
  it("enables user isolation policies on user-owned tables", () => {
    const migration = readFileSync("drizzle/0000_omniscient_norrin_radd.sql", "utf8");

    expect(migration).toContain('ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain("current_setting('app.current_user_id', true)");
    expect(migration).toContain('CREATE POLICY "agent_proposals_user_isolation"');
  });
});
