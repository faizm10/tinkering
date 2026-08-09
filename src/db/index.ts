import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";
import * as schema from "@/db/schema";

const connectionString = env.DATABASE_URL || "postgres://placeholder:placeholder@localhost:5432/placeholder";
const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
