import OpenAI from "openai";
import { env, hasOpenAI } from "@/lib/env";
import { agentProposalSchema, type AgentProposal } from "@/lib/validations/proposal";
import { agentInstructions } from "@/server/agent/instructions";
import { emptyDraft, inferProposalFromInput, runTool, toolDefinitions, type ToolCallLog } from "@/server/agent/tools";

export type AgentResult = {
  proposal: AgentProposal;
  toolCalls: ToolCallLog[];
  stepCount: number;
};

export interface ModelAdapter {
  createProposal(input: string): Promise<AgentResult>;
}

export class FakeModelAdapter implements ModelAdapter {
  async createProposal(input: string): Promise<AgentResult> {
    const proposal = agentProposalSchema.parse(inferProposalFromInput(input));
    return {
      proposal,
      toolCalls: [
        {
          name: "get_current_date",
          arguments: {},
          result: { ok: true },
        },
      ],
      stepCount: 1,
    };
  }
}

export class OpenAIResponsesAdapter implements ModelAdapter {
  private client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  async createProposal(input: string): Promise<AgentResult> {
    const draft = emptyDraft();
    const toolCalls: ToolCallLog[] = [];
    let response = await this.client.responses.create({
      model: env.OPENAI_MODEL,
      instructions: agentInstructions,
      input,
      tools: toolDefinitions as never,
    });

    for (let step = 1; step <= 8; step += 1) {
      const calls = (response.output ?? []).filter((item: { type?: string }) => item.type === "function_call") as Array<{
        name: string;
        arguments: string;
        call_id: string;
      }>;
      if (calls.length === 0) {
        const outputText = response.output_text;
        if (outputText) {
          return {
            proposal: agentProposalSchema.parse(JSON.parse(outputText)),
            toolCalls,
            stepCount: step,
          };
        }
        break;
      }

      const outputs = calls.map((call: { name: string; arguments: string; call_id: string }) => {
        const args = call.arguments ? JSON.parse(call.arguments) : {};
        const result = runTool(call.name, args, draft);
        toolCalls.push({ name: call.name, arguments: args, result });
        return {
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result),
        };
      });

      response = await this.client.responses.create({
        model: env.OPENAI_MODEL,
        previous_response_id: response.id,
        input: outputs as never,
      });
    }

    if (draft.lifeEvent) {
      return {
        proposal: agentProposalSchema.parse({
          summary: "Created a structured plan from the available details.",
          lifeEvent: draft.lifeEvent,
          tasks: draft.tasks,
          reminders: draft.reminders,
          waitingItems: draft.waitingItems,
          clarificationQuestions: draft.clarificationQuestions,
        }),
        toolCalls,
        stepCount: toolCalls.length,
      };
    }

    throw new Error("The agent reached the step limit before producing a valid proposal.");
  }
}

export function getModelAdapter(): ModelAdapter {
  return hasOpenAI() ? new OpenAIResponsesAdapter() : new FakeModelAdapter();
}
