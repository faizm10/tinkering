import { afterEach, describe, expect, it } from "vitest";
import { decryptJson, encryptJson } from "./crypto";

afterEach(() => {
  delete process.env.ANALYTICS_ENCRYPTION_KEY;
});

describe("analytics credential encryption", () => {
  it("round-trips encrypted service-account credentials", () => {
    process.env.ANALYTICS_ENCRYPTION_KEY = "test-only-encryption-key";
    const encrypted = encryptJson({
      client_email: "analytics@example.iam.gserviceaccount.com",
      private_key: "private-key",
    });

    expect(encrypted).not.toContain("analytics@example");
    expect(decryptJson(encrypted)).toEqual({
      client_email: "analytics@example.iam.gserviceaccount.com",
      private_key: "private-key",
    });
  });
});
