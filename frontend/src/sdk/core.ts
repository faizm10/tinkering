import { randomUUID } from "node:crypto";
import { MAX_BATCH_EVENTS, SESSION_TIMEOUT_MS } from "@/lib/tracking";

export type SdkEvent = {
  id: string;
  name: string;
  anonymousId: string;
  sessionId: string;
  timestamp: string;
  userId?: string;
  traits?: Record<string, unknown>;
  properties: Record<string, unknown>;
};

export type SdkState = {
  anonymousId: string;
  sessionId: string;
  lastActivityAt: number;
  consent: boolean;
  user: { id: string; traits: Record<string, unknown> } | null;
  queue: SdkEvent[];
};

export function createSdkState(now = Date.now(), consent = true): SdkState {
  return {
    anonymousId: randomUUID(),
    sessionId: randomUUID(),
    lastActivityAt: now,
    consent,
    user: null,
    queue: [],
  };
}

export function enqueue(
  state: SdkState,
  name: string,
  properties: Record<string, unknown> = {},
  now = Date.now(),
) {
  if (!state.consent) return null;
  if (now - state.lastActivityAt >= SESSION_TIMEOUT_MS) state.sessionId = randomUUID();
  state.lastActivityAt = now;
  const event: SdkEvent = {
    id: randomUUID(),
    name,
    anonymousId: state.anonymousId,
    sessionId: state.sessionId,
    timestamp: new Date(now).toISOString(),
    userId: state.user?.id,
    traits: state.user?.traits,
    properties,
  };
  state.queue.push(event);
  return event;
}

export function identify(
  state: SdkState,
  userId: string,
  traits: Record<string, unknown> = {},
  now = Date.now(),
) {
  state.user = { id: userId, traits };
  return enqueue(state, "$identify", {}, now);
}

export function reset(state: SdkState, now = Date.now()) {
  state.user = null;
  state.anonymousId = randomUUID();
  state.sessionId = randomUUID();
  state.lastActivityAt = now;
}

export function takeBatch(state: SdkState) {
  return state.queue.splice(0, MAX_BATCH_EVENTS);
}
