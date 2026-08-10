import "server-only";

import { drizzle } from "drizzle-orm/neon-serverless";
import { env } from "@/lib/env";
import * as schema from "@/db/schema";

const connectionString = env.DATABASE_URL || "postgres://placeholder:placeholder@localhost:5432/placeholder";

export const db = drizzle(connectionString, { schema });
