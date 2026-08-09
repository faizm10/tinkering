import "server-only";

import { env } from "@/lib/env";
import { BetterAuthProvider } from "@/server/providers/auth/better-auth";
import { DemoAuthProvider } from "@/server/providers/auth/demo-auth";
import type { AuthProvider } from "@/server/providers/auth/provider";
import { MockAgentProvider } from "@/server/providers/agent/mock-agent";
import { OpenAIAgentProvider } from "@/server/providers/agent/openai-agent";
import type { AgentProvider } from "@/server/providers/agent/provider";
import { DrizzleDataRepository } from "@/server/providers/data/drizzle-repository";
import { MemoryDataRepository } from "@/server/providers/data/memory-repository";
import type { DataRepository } from "@/server/providers/data/repository";

const authProvider: AuthProvider =
  env.AUTH_PROVIDER === "better-auth" ? new BetterAuthProvider() : new DemoAuthProvider();

const dataRepository: DataRepository =
  env.DATA_PROVIDER === "postgres" ? new DrizzleDataRepository() : new MemoryDataRepository();

const agentProvider: AgentProvider =
  env.AI_PROVIDER === "openai" ? new OpenAIAgentProvider() : new MockAgentProvider();

export function getAuthProvider() {
  return authProvider;
}

export function getDataRepository() {
  return dataRepository;
}

export function getAgentProvider() {
  return agentProvider;
}
