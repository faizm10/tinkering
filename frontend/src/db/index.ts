import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  return drizzle(neon(databaseUrl), { schema });
}

let database: ReturnType<typeof createDatabase> | null = null;

export function getDatabase() {
  if (!database) database = createDatabase();
  return database;
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}
