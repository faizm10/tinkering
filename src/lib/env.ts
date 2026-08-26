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
  DATABASE_URL_UNPOOLED: z.string().url().optional().or(z.literal("")),
  NEON_AUTH_BASE_URL: z.string().url().optional().or(z.literal("")),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32).optional().or(z.literal("")),
  OPENAI_API_KEY: z.string().optional().or(z.literal("")),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
  AGENT_MAX_STEPS: z.coerce.number().int().min(1).max(30).default(12),
  AGENT_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(20_000),
  AGENT_CLARIFICATION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(168),
  CRON_SECRET: z.string().optional().or(z.literal("")),
  APP_BASE_URL: z.string().url().optional().or(z.literal("")),
  QSTASH_TOKEN: z.string().optional().or(z.literal("")),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional().or(z.literal("")),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional().or(z.literal("")),
  RESEND_API_KEY: z.string().optional().or(z.literal("")),
  RESEND_FROM_EMAIL: z.string().optional().or(z.literal("")),
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

  if (value.AUTH_PROVIDER === "better-auth" && !value.NEON_AUTH_BASE_URL) {
    ctx.addIssue({
      code: "custom",
      path: ["NEON_AUTH_BASE_URL"],
      message: "NEON_AUTH_BASE_URL is required when AUTH_PROVIDER=better-auth.",
    });
  }

  if (value.AUTH_PROVIDER === "better-auth" && !value.NEON_AUTH_COOKIE_SECRET) {
    ctx.addIssue({
      code: "custom",
      path: ["NEON_AUTH_COOKIE_SECRET"],
      message: "NEON_AUTH_COOKIE_SECRET is required when AUTH_PROVIDER=better-auth.",
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
  DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
  NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
  NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  AGENT_MAX_STEPS: process.env.AGENT_MAX_STEPS,
  AGENT_TIMEOUT_MS: process.env.AGENT_TIMEOUT_MS,
  AGENT_CLARIFICATION_TTL_HOURS: process.env.AGENT_CLARIFICATION_TTL_HOURS,
  CRON_SECRET: process.env.CRON_SECRET,
  APP_BASE_URL: process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  QSTASH_TOKEN: process.env.QSTASH_TOKEN,
  QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
  QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  NODE_ENV: process.env.NODE_ENV,
});

export function hasDatabase() {
  return env.DATA_PROVIDER === "postgres";
}

export function hasOpenAI() {
  return env.AI_PROVIDER === "openai";
}

export function hasReminderDelivery() {
  return Boolean(env.APP_BASE_URL && env.QSTASH_TOKEN && env.RESEND_API_KEY && env.RESEND_FROM_EMAIL);
}

export function hasQstashSigningKeys() {
  return Boolean(env.QSTASH_CURRENT_SIGNING_KEY && env.QSTASH_NEXT_SIGNING_KEY);
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
