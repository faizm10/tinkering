import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/env";

describe("environment provider modes", () => {
  it("defaults safely to demo providers", () => {
    const env = parseServerEnv({});

    expect(env.APP_MODE).toBe("demo");
    expect(env.DATA_PROVIDER).toBe("memory");
    expect(env.AI_PROVIDER).toBe("mock");
    expect(env.AUTH_PROVIDER).toBe("demo");
  });

  it("rejects production demo providers", () => {
    expect(() =>
      parseServerEnv({
        APP_MODE: "production",
        DATA_PROVIDER: "memory",
        AI_PROVIDER: "mock",
        AUTH_PROVIDER: "demo",
      }),
    ).toThrow();
  });

  it("requires credentials for production providers", () => {
    expect(() =>
      parseServerEnv({
        APP_MODE: "demo",
        DATA_PROVIDER: "postgres",
        AI_PROVIDER: "openai",
        AUTH_PROVIDER: "better-auth",
      }),
    ).toThrow();
  });

  it("accepts Neon Auth and Postgres credentials for managed auth", () => {
    const env = parseServerEnv({
      APP_MODE: "demo",
      DATA_PROVIDER: "postgres",
      AI_PROVIDER: "mock",
      AUTH_PROVIDER: "better-auth",
      DATABASE_URL: "postgres://user:password@example.neon.tech/neondb",
      NEON_AUTH_BASE_URL: "https://example.neonauth.us-east-2.aws.neon.tech/neondb/auth",
      NEON_AUTH_COOKIE_SECRET: "x".repeat(32),
    });

    expect(env.DATA_PROVIDER).toBe("postgres");
    expect(env.AUTH_PROVIDER).toBe("better-auth");
  });
});
