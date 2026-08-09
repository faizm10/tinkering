import "server-only";

import { env } from "@/lib/env";
import { AGENT_PROMPT_VERSION } from "@/server/agent/instructions";
import { OpenAIResponsesAdapter } from "@/server/agent/model-adapter";
import type { AgentProvider, AgentProviderContext, AgentProviderResult } from "@/server/providers/agent/provider";
import { AgentConfigurationError } from "@/server/agent/errors";

export class OpenAIAgentProvider implements AgentProvider {
  async createProposal(input: string, context: AgentProviderContext): Promise<AgentProviderResult> {
    if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL) throw new AgentConfigurationError("OpenAI provider is enabled but OPENAI_API_KEY or OPENAI_MODEL is missing.");

    const result = await new OpenAIResponsesAdapter().createProposal(input, context);
    return {
      ...result,
      provider: "openai",
      model: env.OPENAI_MODEL,
      usage: { ...(result.usage ?? {}), promptVersion: AGENT_PROMPT_VERSION },
    };
  }
}
