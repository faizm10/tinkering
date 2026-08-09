import { describe, expect, it } from "vitest";
import { buildDailyBrief } from "@/server/daily-brief/brief";
import { getDemoDashboard } from "@/server/services/demo-store";

describe("daily brief", () => {
  it("summarizes due and waiting work", () => {
    const summary = buildDailyBrief(getDemoDashboard());
    expect(summary).toContain("Today");
    expect(summary.length).toBeGreaterThan(20);
  });
});
