import "server-only";

import { env } from "@/lib/env";
import { OpenAIResponsesAdapter } from "@/server/agent/model-adapter";
import type { AgentProvider, AgentProviderResult } from "@/server/providers/agent/provider";

export class OpenAIAgentProvider implements AgentProvider {
  async createProposal(input: string): Promise<AgentProviderResult> {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OpenAI provider is enabled but OPENAI_API_KEY is missing.");
    }

    const result = await new OpenAIResponsesAdapter().createProposal(input);
    return {
      ...result,
      provider: "openai",
      model: env.OPENAI_MODEL,
      progress: ["understanding", "checking_dates", "reviewing_context", "organizing", "ready"],
    };
  }
}
