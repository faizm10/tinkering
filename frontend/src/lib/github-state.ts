import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function stateSecret() {
  const secret = process.env.DATA_HASH_SECRET;
  if (!secret) throw new Error("DATA_HASH_SECRET is required for GitHub installation state");
  return secret;
}

export function createGitHubInstallState(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      issuedAt: Date.now(),
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyGitHubInstallState(state: string, expectedUserId: string) {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return false;
  const expected = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  if (signature.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId: string;
      issuedAt: number;
    };
    return value.userId === expectedUserId && Date.now() - value.issuedAt < 10 * 60_000;
  } catch {
    return false;
  }
}
