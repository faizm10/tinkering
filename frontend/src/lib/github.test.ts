import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { verifyGitHubWebhook } from "./github";

afterEach(() => {
  delete process.env.GITHUB_WEBHOOK_SECRET;
});

describe("GitHub webhook verification", () => {
  it("accepts a valid sha256 signature", () => {
    process.env.GITHUB_WEBHOOK_SECRET = "test-secret";
    const payload = JSON.stringify({ zen: "Keep it logically awesome." });
    const signature = `sha256=${createHmac("sha256", "test-secret").update(payload).digest("hex")}`;
    expect(verifyGitHubWebhook(payload, signature)).toBe(true);
  });

  it("rejects a changed payload", () => {
    process.env.GITHUB_WEBHOOK_SECRET = "test-secret";
    const signature = `sha256=${createHmac("sha256", "test-secret").update("{}").digest("hex")}`;
    expect(verifyGitHubWebhook('{"changed":true}', signature)).toBe(false);
  });
});
