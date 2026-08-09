import { describe, expect, it } from "vitest";
import { parseNaturalDate, todayISO } from "@/lib/dates";

describe("date helpers", () => {
  const now = new Date("2026-08-09T12:00:00-04:00");

  it("formats today as ISO date", () => {
    expect(todayISO(now)).toBe("2026-08-09");
  });

  it("parses month-day dates without inventing old deadlines", () => {
    expect(parseNaturalDate("moving on September 1", now)).toBe("2026-09-01");
  });

  it("parses next Monday", () => {
    expect(parseNaturalDate("follow up next Monday", now)).toBe("2026-08-10");
  });
});
