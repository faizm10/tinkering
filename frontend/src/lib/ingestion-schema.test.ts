import { describe, expect, it } from "vitest";
import { ingestionBatchSchema } from "./ingestion-schema";

const event = {
  id: "event-12345678",
  name: "project_created",
  anonymousId: "anonymous-123",
  sessionId: "session-123",
  timestamp: new Date().toISOString(),
  properties: {},
};

describe("ingestion validation", () => {
  it("accepts a valid batch", () => {
    expect(ingestionBatchSchema.parse({ projectKey: "rp_pub_demo_project", events: [event] }).events).toHaveLength(1);
  });

  it("rejects batches larger than 50 events", () => {
    expect(() =>
      ingestionBatchSchema.parse({
        projectKey: "rp_pub_demo_project",
        events: Array.from({ length: 51 }, (_, index) => ({ ...event, id: `event-${index}-12345678` })),
      }),
    ).toThrow();
  });

  it("rejects oversized event properties", () => {
    expect(() =>
      ingestionBatchSchema.parse({
        events: [{ ...event, properties: { body: "x".repeat(17 * 1024) } }],
      }),
    ).toThrow();
  });
});
