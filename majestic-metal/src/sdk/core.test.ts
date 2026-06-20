import { describe, expect, it } from "vitest";
import { MAX_BATCH_EVENTS, SESSION_TIMEOUT_MS } from "@/lib/tracking";
import { createSdkState, enqueue, identify, reset, takeBatch } from "./core";

describe("browser SDK state", () => {
  it("does not enqueue events without consent", () => {
    const state = createSdkState(0, false);
    expect(enqueue(state, "$pageview", {}, 1)).toBeNull();
    expect(state.queue).toHaveLength(0);
  });

  it("rotates sessions after 30 minutes of inactivity", () => {
    const state = createSdkState(0);
    const firstSession = state.sessionId;
    enqueue(state, "$pageview", {}, SESSION_TIMEOUT_MS - 1);
    expect(state.sessionId).toBe(firstSession);
    enqueue(state, "$pageview", {}, SESSION_TIMEOUT_MS * 2);
    expect(state.sessionId).not.toBe(firstSession);
  });

  it("attaches identity and resets it without crossing accounts", () => {
    const state = createSdkState(0);
    const anonymousId = state.anonymousId;
    identify(state, "user_123", { plan: "pro" }, 1);
    const identified = enqueue(state, "project_created", {}, 2);
    expect(identified?.userId).toBe("user_123");
    expect(identified?.anonymousId).toBe(anonymousId);

    reset(state, 3);
    const afterReset = enqueue(state, "$pageview", {}, 4);
    expect(afterReset?.userId).toBeUndefined();
    expect(afterReset?.anonymousId).not.toBe(anonymousId);
  });

  it("takes batches of at most 50 events", () => {
    const state = createSdkState(0);
    for (let index = 0; index < 61; index += 1) {
      enqueue(state, "event", { index }, index + 1);
    }
    expect(takeBatch(state)).toHaveLength(MAX_BATCH_EVENTS);
    expect(state.queue).toHaveLength(11);
  });
});
