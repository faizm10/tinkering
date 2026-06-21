import { afterEach, describe, expect, it } from "vitest";
import { createGitHubInstallState, verifyGitHubInstallState } from "./github-state";

afterEach(() => {
  delete process.env.DATA_HASH_SECRET;
});

describe("GitHub installation state", () => {
  it("binds the installation to the signed-in user", () => {
    process.env.DATA_HASH_SECRET = "test-state-secret";
    const state = createGitHubInstallState("user_123");
    expect(verifyGitHubInstallState(state, "user_123")).toBe(true);
    expect(verifyGitHubInstallState(state, "user_456")).toBe(false);
  });

  it("rejects a modified state", () => {
    process.env.DATA_HASH_SECRET = "test-state-secret";
    const state = createGitHubInstallState("user_123");
    expect(verifyGitHubInstallState(`${state}x`, "user_123")).toBe(false);
  });
});
