import { describe, expect, it } from "vitest";
import { normalizeGoogleAnalyticsReports } from "./google-analytics";

describe("Google Analytics normalization", () => {
  it("combines daily totals, events, and acquisition sources", () => {
    const result = normalizeGoogleAnalyticsReports({
      summaryRows: [
        {
          dimensionValues: [{ value: "20260619" }],
          metricValues: [
            { value: "42" },
            { value: "55" },
            { value: "91" },
            { value: "140" },
          ],
        },
      ],
      eventRows: [
        {
          dimensionValues: [{ value: "20260619" }, { value: "page_view" }],
          metricValues: [{ value: "91" }],
        },
        {
          dimensionValues: [{ value: "20260619" }, { value: "sign_up" }],
          metricValues: [{ value: "7" }],
        },
      ],
      referrerRows: [
        {
          dimensionValues: [{ value: "20260619" }, { value: "google" }],
          metricValues: [{ value: "24" }],
        },
      ],
    });

    expect(result).toEqual([
      {
        day: "2026-06-19",
        activeUsers: 42,
        sessions: 55,
        pageviews: 91,
        events: 140,
        eventBreakdown: { page_view: 91, sign_up: 7 },
        referrerBreakdown: { google: 24 },
      },
    ]);
  });
});
