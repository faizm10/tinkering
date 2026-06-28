import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Next app lives in frontend/ while the git root is one level up.
// Without an explicit root, Turbopack can resolve packages from the repo root
// and fail HMR with "Next.js package not found".
const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingRoot: appRoot,
};

export default nextConfig;
