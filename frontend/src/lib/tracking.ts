import { createHash, randomBytes } from "node:crypto";

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
export const MAX_BATCH_EVENTS = 50;
export const MAX_REQUEST_BYTES = 256 * 1024;
export const MAX_PROPERTIES_BYTES = 16 * 1024;

export function hashValue(value: string) {
  const secret = process.env.DATA_HASH_SECRET ?? "development-only-hash-secret";
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}

export function createTrackingKey(kind: "public" | "secret", projectSlug: string) {
  const prefix = kind === "public" ? "rp_pub" : "rp_sec";
  return `${prefix}_${projectSlug}_${randomBytes(24).toString("base64url")}`;
}

export function isSessionExpired(lastActivityAt: number, now = Date.now()) {
  return now - lastActivityAt >= SESSION_TIMEOUT_MS;
}

export function sanitizeTraits(traits: Record<string, unknown> | undefined) {
  if (!traits) return {};
  return Object.fromEntries(
    Object.entries(traits)
      .filter(([key, value]) => key.length <= 64 && value !== undefined)
      .slice(0, 32),
  );
}
