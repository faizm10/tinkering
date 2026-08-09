import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional().or(z.literal("")),
  BETTER_AUTH_SECRET: z.string().min(16).optional().or(z.literal("")),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  OPENAI_API_KEY: z.string().optional().or(z.literal("")),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
  CRON_SECRET: z.string().optional().or(z.literal("")),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  CRON_SECRET: process.env.CRON_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});

export function hasDatabase() {
  return Boolean(env.DATABASE_URL);
}

export function hasOpenAI() {
  return Boolean(env.OPENAI_API_KEY);
}

export function requireCronSecret(value: string | null) {
  if (!env.CRON_SECRET) {
    throw new Error("Cron secret is not configured.");
  }

  if (value !== `Bearer ${env.CRON_SECRET}`) {
    throw new Error("Invalid cron secret.");
  }
}
