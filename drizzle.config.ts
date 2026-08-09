import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config();

const migrationUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL is required for Drizzle migrations.");
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
  strict: true,
  verbose: true,
});
