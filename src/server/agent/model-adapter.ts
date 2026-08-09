import OpenAI from "openai";

import { env, hasOpenAI } from "@/lib/env";
import { agentProposalSchema, type AgentProposal } from "@/lib/validations/proposal";
import { resolveDateExpression } from "@/server/agent/date-resolver";
import { AgentConfigurationError, AgentProviderError, AgentStepLimitError, AgentTimeoutError, AgentValidationError } from "@/server/agent/errors";
import { agentInstructions, AGENT_PROMPT_VERSION } from "@/server/agent/instructions";
import { ProposalBuilder } from "@/server/agent/proposal-builder";
import { AgentToolRegistry, inferProposalFromInput, toolDefinitions, type ToolCallLog } from "@/server/agent/tools";
import type { AgentProviderContext, AgentProgressEvent, AgentProgressStage } from "@/server/providers/agent/provider";

export type AgentResult = {
  proposal: AgentProposal;
  toolCalls: ToolCallLog[];
  stepCount: number;
  progress: AgentProgressStage[];
  progressEvents: AgentProgressEvent[];
  usage?: Record<string, unknown> | null;
};

export interface ModelAdapter {
  createProposal(input: string, context?: AgentProviderContext): Promise<AgentResult>;
}

export class FakeModelAdapter implements ModelAdapter {
  async createProposal(input: string, context?: AgentProviderContext): Promise<AgentResult> {
    const proposal = agentProposalSchema.parse(inferProposalFromInput(input));
    const runId = context?.runId ?? "fake-run";
    return {
      proposal,
      toolCalls: [{ name: "get_current_datetime", arguments: {}, result: { ok: true }, success: true, durationMs: 0 }],
      stepCount: 1,
      progress: proposal.clarificationQuestions.length ? ["understanding", "checking_dates", "awaiting_clarification"] : ["understanding", "checking_dates", "ready"],
      progressEvents: [
        { runId, type: "understanding", timestamp: new Date().toISOString(), message: "Understanding the situation." },
        { runId, type: proposal.clarificationQuestions.length ? "awaiting_clarification" : "ready", timestamp: new Date().toISOString(), message: proposal.clarificationQuestions.length ? "Waiting for one detail." : "Ready for review." },
      ],
      usage: null,
    };
  }
}

type ResponseLike = {
  id: string;
  output?: Array<{ type?: string; name?: string; arguments?: string; call_id?: string }>;
  output_text?: string;
  usage?: Record<string, unknown> | null;
};

function proposalJsonSchema() {
  const isoDate = { anyOf: [{ type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, { type: "null" }] };
  return {
    type: "object",
    additionalProperties: false,
    required: ["version", "summary", "category", "confidence", "assumptions", "lifeEvent", "tasks", "reminders", "waitingItems", "clarificationQuestions"],
    properties: {
      version: { type: "number", enum: [1] },
      summary: { type: "string" },
      category: { type: "string" },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
      assumptions: { type: "array", items: { type: "string" } },
      lifeEvent: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "category", "startDate", "endDate"],
        properties: { title: { type: "string" }, description: { type: "string" }, category: { type: "string" }, startDate: isoDate, endDate: isoDate },
      },
      tasks: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["temporaryId", "title", "description", "priority", "dueDate"],
          properties: { temporaryId: { type: "string" }, title: { type: "string" }, description: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high"] }, dueDate: isoDate },
        },
      },
      reminders: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["temporaryId", "title", "remindAt", "relatedTaskId"],
          properties: { temporaryId: { type: "string" }, title: { type: "string" }, remindAt: { type: "string" }, relatedTaskId: { anyOf: [{ type: "string" }, { type: "null" }] } },
        },
      },
      waitingItems: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["temporaryId", "title", "description", "waitingOn", "expectedBy", "followUpDate"],
          properties: { temporaryId: { type: "string" }, title: { type: "string" }, description: { type: "string" }, waitingOn: { type: "string" }, expectedBy: isoDate, followUpDate: isoDate },
        },
      },
      clarificationQuestions: { type: "array", items: { type: "string" } },
    },
  };
}

function functionCalls(response: ResponseLike) {
  return (response.output ?? []).filter((item: { type?: string }) => item.type === "function_call") as Array<{
    name: string;
    arguments: string;
    call_id: string;
  }>;
}

function progressEvent(runId: string, type: AgentProgressStage, message: string): AgentProgressEvent {
  return { runId, type, timestamp: new Date().toISOString(), message };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new AgentTimeoutError()), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export class OpenAIResponsesAdapter implements ModelAdapter {
  private client: OpenAI;

  constructor(client = new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: env.AGENT_TIMEOUT_MS })) {
    this.client = client;
  }

  async createProposal(input: string, context?: AgentProviderContext): Promise<AgentResult> {
    if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL) throw new AgentConfigurationError("OpenAI provider is enabled without an API key or model.");
    if (!context) throw new AgentConfigurationError("OpenAI provider requires an agent context.");

    const builder = new ProposalBuilder();
    const registry = new AgentToolRegistry();
    const toolCalls: ToolCallLog[] = [];
    const progress: AgentProgressStage[] = ["understanding", "checking_dates", "reviewing_context"];
    const progressEvents = [
      progressEvent(context.runId, "understanding", "Understanding the situation."),
      progressEvent(context.runId, "checking_dates", "Checking the important dates."),
      progressEvent(context.runId, "reviewing_context", "Reviewing your current Sonae context."),
    ];
    const profile = await context.repository.getProfile(context.userId);
    const toolContext = { userId: context.userId, repository: context.repository, builder, timezone: profile.timezone };

    let response: ResponseLike;
    try {
      response = (await withTimeout(
        this.client.responses.create({
          model: env.OPENAI_MODEL,
          instructions: agentInstructions,
          input: `User situation:\n${input}\n\nUse tools to inspect context and build temporary proposal state. Then call finalize_proposal or ask_clarification.`,
          tools: toolDefinitions as never,
          parallel_tool_calls: false,
          metadata: { prompt_version: AGENT_PROMPT_VERSION, app: "sonae" },
          text: {
            format: {
              type: "json_schema",
              name: "sonae_agent_proposal",
              strict: true,
              schema: proposalJsonSchema(),
            },
          },
        }),
        env.AGENT_TIMEOUT_MS,
      )) as ResponseLike;
    } catch (error) {
      if (error instanceof AgentTimeoutError) throw error;
      throw new AgentProviderError(error instanceof Error ? error.message : "OpenAI request failed.");
    }

    let usage: Record<string, unknown> | null = response.usage ? { ...response.usage } : null;
    for (let step = 1; step <= env.AGENT_MAX_STEPS; step += 1) {
      const calls = functionCalls(response);
      if (calls.length === 0) {
        if (response.output_text) {
          progress.push("validating", "ready");
          progressEvents.push(progressEvent(context.runId, "validating", "Validating the proposal."), progressEvent(context.runId, "ready", "Ready for review."));
          try {
            return { proposal: agentProposalSchema.parse(JSON.parse(response.output_text)), toolCalls, stepCount: step, progress, progressEvents, usage };
          } catch (error) {
            throw new AgentValidationError(error instanceof Error ? error.message : "Invalid structured output.");
          }
        }
        break;
      }

      const outputs = [];
      for (const call of calls) {
        const args = call.arguments ? JSON.parse(call.arguments) : {};
        const log = await registry.execute(call.name, args, toolContext, call.call_id);
        toolCalls.push(log);
        if (!log.success) throw new AgentProviderError(log.error ?? "Tool failed.");
        outputs.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(log.result) });
      }

      try {
        response = (await withTimeout(
          this.client.responses.create({
            model: env.OPENAI_MODEL,
            previous_response_id: response.id,
            input: outputs as never,
            tools: toolDefinitions as never,
            parallel_tool_calls: false,
          }),
          env.AGENT_TIMEOUT_MS,
        )) as ResponseLike;
        usage = response.usage ? { ...response.usage } : usage;
      } catch (error) {
        if (error instanceof AgentTimeoutError) throw error;
        throw new AgentProviderError(error instanceof Error ? error.message : "OpenAI continuation failed.");
      }

      const finalized = toolCalls.findLast((call) => call.name === "finalize_proposal")?.result as { proposal?: AgentProposal } | undefined;
      if (finalized?.proposal) {
        progress.push("validating", "ready");
        progressEvents.push(progressEvent(context.runId, "validating", "Validating the proposal."), progressEvent(context.runId, "ready", "Ready for review."));
        return { proposal: agentProposalSchema.parse(finalized.proposal), toolCalls, stepCount: step, progress, progressEvents, usage };
      }
      const clarification = toolCalls.findLast((call) => call.name === "ask_clarification")?.result as { question?: string } | undefined;
      if (clarification?.question) {
        const resolved = resolveDateExpression(input, profile.timezone);
        const draft = agentProposalSchema.parse({
          version: 1,
          summary: "Sonae needs one detail before drafting the plan.",
          category: "general",
          confidence: "low",
          assumptions: [resolved.explanation],
          lifeEvent: {
            title: "Sonae Plan",
            description: "Prepare a plan once the missing detail is known.",
            category: "general",
            startDate: null,
            endDate: null,
          },
          tasks: [],
          reminders: [],
          waitingItems: [],
          clarificationQuestions: [clarification.question],
        });
        progress.push("awaiting_clarification");
        progressEvents.push(progressEvent(context.runId, "awaiting_clarification", "Waiting for one detail."));
        return { proposal: draft, toolCalls, stepCount: step, progress, progressEvents, usage };
      }
    }

    throw new AgentStepLimitError("The agent reached the step limit before producing a valid proposal.");
  }
}

export function getModelAdapter(): ModelAdapter {
  return hasOpenAI() ? new OpenAIResponsesAdapter() : new FakeModelAdapter();
}
