import "server-only";

import { createNeonAuth } from "@neondatabase/auth/next/server";
import { env } from "@/lib/env";

export const auth = createNeonAuth({
  baseUrl: env.NEON_AUTH_BASE_URL || "http://localhost:3000/api/auth",
  cookies: {
    secret: env.NEON_AUTH_COOKIE_SECRET || "development-only-neon-auth-cookie-secret",
  },
  logLevel: env.APP_MODE === "demo" ? "silent" : "warn",
});
