import { z } from "zod";

const appModeSchema = z.enum(["demo", "production"]);
const dataProviderSchema = z.enum(["memory", "postgres"]);
const aiProviderSchema = z.enum(["mock", "openai"]);
const authProviderSchema = z.enum(["demo", "better-auth"]);

const envSchema = z.object({
  APP_MODE: appModeSchema.default("demo"),
  DATA_PROVIDER: dataProviderSchema.default("memory"),
  AI_PROVIDER: aiProviderSchema.default("mock"),
  AUTH_PROVIDER: authProviderSchema.default("demo"),
  DATABASE_URL: z.string().url().optional().or(z.literal("")),
  BETTER_AUTH_SECRET: z.string().min(16).optional().or(z.literal("")),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  OPENAI_API_KEY: z.string().optional().or(z.literal("")),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
  CRON_SECRET: z.string().optional().or(z.literal("")),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
}).superRefine((value, ctx) => {
  if (value.APP_MODE === "production") {
    if (value.AUTH_PROVIDER === "demo") {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_PROVIDER"],
        message: "Production mode cannot use demo authentication.",
      });
    }
    if (value.DATA_PROVIDER === "memory") {
      ctx.addIssue({
        code: "custom",
        path: ["DATA_PROVIDER"],
        message: "Production mode cannot use in-memory storage.",
      });
    }
    if (value.AI_PROVIDER === "mock") {
      ctx.addIssue({
        code: "custom",
        path: ["AI_PROVIDER"],
        message: "Production mode cannot use the mock agent.",
      });
    }
  }

  if (value.DATA_PROVIDER === "postgres" && !value.DATABASE_URL) {
    ctx.addIssue({
      code: "custom",
      path: ["DATABASE_URL"],
      message: "DATABASE_URL is required when DATA_PROVIDER=postgres.",
    });
  }

  if (value.AUTH_PROVIDER === "better-auth" && !value.BETTER_AUTH_SECRET) {
    ctx.addIssue({
      code: "custom",
      path: ["BETTER_AUTH_SECRET"],
      message: "BETTER_AUTH_SECRET is required when AUTH_PROVIDER=better-auth.",
    });
  }

  if (value.AI_PROVIDER === "openai" && !value.OPENAI_API_KEY) {
    ctx.addIssue({
      code: "custom",
      path: ["OPENAI_API_KEY"],
      message: "OPENAI_API_KEY is required when AI_PROVIDER=openai.",
    });
  }
});

export function parseServerEnv(values: Record<string, string | undefined>) {
  return envSchema.parse(values);
}

export const env = parseServerEnv({
  APP_MODE: process.env.APP_MODE,
  DATA_PROVIDER: process.env.DATA_PROVIDER,
  AI_PROVIDER: process.env.AI_PROVIDER,
  AUTH_PROVIDER: process.env.AUTH_PROVIDER,
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  CRON_SECRET: process.env.CRON_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});

export function hasDatabase() {
  return env.DATA_PROVIDER === "postgres";
}

export function hasOpenAI() {
  return env.AI_PROVIDER === "openai";
}

export function isDemoMode() {
  return env.APP_MODE === "demo";
}

export function requireCronSecret(value: string | null) {
  if (!env.CRON_SECRET) {
    throw new Error("Cron secret is not configured.");
  }

  if (value !== `Bearer ${env.CRON_SECRET}`) {
    throw new Error("Invalid cron secret.");
  }
}
