import { z } from "zod";

import { todayISO } from "@/lib/dates";
import type { AgentProposal } from "@/lib/validations/proposal";
import { resolveDateExpression } from "@/server/agent/date-resolver";
import { AgentToolError } from "@/server/agent/errors";
import { ProposalBuilder } from "@/server/agent/proposal-builder";
import type { DataRepository } from "@/server/providers/data/repository";

export type ToolCallLog = {
  name: string;
  callId?: string;
  arguments: Record<string, unknown>;
  result: unknown;
  durationMs?: number;
  success?: boolean;
  error?: string;
};

export type ProposalDraft = Partial<AgentProposal> & {
  tasks: AgentProposal["tasks"];
  reminders: AgentProposal["reminders"];
  waitingItems: AgentProposal["waitingItems"];
  clarificationQuestions: string[];
};

export type AgentToolContext = {
  userId: string;
  repository: DataRepository;
  builder: ProposalBuilder;
  timezone: string;
  now?: Date;
};

export function emptyDraft(): ProposalDraft {
  return { tasks: [], reminders: [], waitingItems: [], clarificationQuestions: [] };
}

const emptyArgs = z.object({}).strict();
const optionalStringArg = () => z.string().trim().min(1).nullable().optional().transform((value) => value ?? undefined);
const optionalDateArg = () => z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().transform((value) => value ?? undefined);
const categoryFilterArgs = z.object({
  category: optionalStringArg(),
  startDate: optionalDateArg(),
  endDate: optionalDateArg(),
}).strict();
const upcomingTasksArgs = z.object({
  lifeEventId: optionalStringArg(),
  startDate: optionalDateArg(),
  endDate: optionalDateArg(),
}).strict();
const waitingItemsArgs = z.object({ status: z.enum(["waiting", "follow_up_due", "resolved", "cancelled"]).nullable().optional().transform((value) => value ?? undefined) }).strict();
const resolveDateArgs = z.object({
  expression: z.string().trim().min(1).max(200),
  timezone: z.string().trim().min(2).max(80).nullable().optional().transform((value) => value ?? undefined),
  referenceDate: optionalDateArg(),
}).strict();
const proposeLifeEventArgs = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(700).default(""),
  category: z.enum(["moving", "travel", "purchase_return", "follow_up", "appointment", "document_renewal", "home_maintenance", "general"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
}).strict();
const proposeTaskArgs = z.object({
  temporaryId: z.string().trim().min(2).max(60).nullable().optional().transform((value) => value ?? undefined),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
}).strict();
const proposeReminderArgs = z.object({
  temporaryId: z.string().trim().min(2).max(60).nullable().optional().transform((value) => value ?? undefined),
  title: z.string().trim().min(2).max(120),
  remindAt: z.string().datetime({ offset: true }),
  relatedTaskId: z.string().trim().min(2).max(60).nullable().optional(),
  relatedTaskIndex: z.number().int().min(0).nullable().optional(),
}).strict();
const proposeWaitingItemArgs = z.object({
  temporaryId: z.string().trim().min(2).max(60).nullable().optional().transform((value) => value ?? undefined),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  waitingOn: z.string().trim().min(2).max(120),
  expectedBy: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
}).strict();
const askClarificationArgs = z.object({
  question: z.string().trim().min(2).max(180),
  missingFields: z.array(z.string().trim().min(1).max(60)).max(5).default([]),
  reason: z.string().trim().min(2).max(180).default("A required planning detail is missing."),
}).strict();
const finalizeProposalArgs = z.object({
  summary: z.string().trim().min(2).max(500),
  category: z.enum(["moving", "travel", "purchase_return", "follow_up", "appointment", "document_renewal", "home_maintenance", "general"]).default("general"),
  confidence: z.enum(["low", "medium", "high"]).default("medium"),
}).strict();

type AgentTool<TSchema extends z.ZodTypeAny = z.ZodTypeAny> = {
  name: string;
  description: string;
  schema: TSchema;
  parameters: Record<string, unknown>;
  execute(args: z.output<TSchema>, context: AgentToolContext): Promise<unknown>;
};

function defineTool<TSchema extends z.ZodTypeAny>(tool: AgentTool<TSchema>) {
  return tool;
}

function schemaObject(properties: Record<string, unknown>, required = Object.keys(properties)) {
  return { type: "object", additionalProperties: false, properties, required };
}

const tools: AgentTool[] = [
  defineTool({
    name: "get_current_datetime",
    description: "Return current UTC time, current date, user timezone, and current date in the user timezone.",
    schema: emptyArgs,
    parameters: schemaObject({}),
    async execute(_args, context) {
      const now = context.now ?? new Date();
      return { utc: now.toISOString(), currentDate: todayISO(now), timezone: context.timezone };
    },
  }),
  defineTool({
    name: "get_user_preferences",
    description: "Return limited user planning preferences.",
    schema: emptyArgs,
    parameters: schemaObject({}),
    async execute(_args, context) {
      const profile = await context.repository.getProfile(context.userId);
      return { timezone: profile.timezone, reminderPreference: profile.reminderPreference };
    },
  }),
  defineTool({
    name: "get_active_life_events",
    description: "Return user-owned active life events, optionally filtered by category and date range.",
    schema: categoryFilterArgs,
    parameters: schemaObject({
      category: { type: ["string", "null"] },
      startDate: { type: ["string", "null"] },
      endDate: { type: ["string", "null"] },
    }),
    async execute(args, context) {
      const events = await context.repository.listLifeEvents(context.userId);
      return {
        lifeEvents: events
          .filter((event) => event.status === "active")
          .filter((event) => !args.category || event.category === args.category)
          .filter((event) => !args.startDate || !event.endDate || event.endDate >= args.startDate)
          .filter((event) => !args.endDate || !event.startDate || event.startDate <= args.endDate)
          .map(({ id, title, category, startDate, endDate, status }) => ({ id, title, category, startDate, endDate, status })),
      };
    },
  }),
  defineTool({
    name: "get_upcoming_tasks",
    description: "Return user-owned incomplete tasks, optionally filtered by event and dates.",
    schema: upcomingTasksArgs,
    parameters: schemaObject({
      lifeEventId: { type: ["string", "null"] },
      startDate: { type: ["string", "null"] },
      endDate: { type: ["string", "null"] },
    }),
    async execute(args, context) {
      const tasks = await context.repository.listTasks(context.userId);
      return {
        tasks: tasks
          .filter((task) => task.status !== "completed")
          .filter((task) => !args.lifeEventId || task.lifeEventId === args.lifeEventId)
          .filter((task) => !args.startDate || !task.dueDate || task.dueDate >= args.startDate)
          .filter((task) => !args.endDate || !task.dueDate || task.dueDate <= args.endDate)
          .map(({ id, lifeEventId, title, priority, dueDate, status }) => ({ id, lifeEventId, title, priority, dueDate, status })),
      };
    },
  }),
  defineTool({
    name: "get_waiting_items",
    description: "Return user-owned waiting items.",
    schema: waitingItemsArgs,
    parameters: schemaObject({ status: { type: ["string", "null"], enum: ["waiting", "follow_up_due", "resolved", "cancelled", null] } }),
    async execute(args, context) {
      const items = await context.repository.listWaitingItems(context.userId);
      return {
        waitingItems: items
          .filter((item) => !args.status || item.status === args.status)
          .filter((item) => item.status !== "resolved")
          .map(({ id, lifeEventId, title, waitingOn, expectedBy, followUpDate, status }) => ({ id, lifeEventId, title, waitingOn, expectedBy, followUpDate, status })),
      };
    },
  }),
  defineTool({
    name: "resolve_date_expression",
    description: "Resolve a user date expression through deterministic application code.",
    schema: resolveDateArgs,
    parameters: schemaObject({
      expression: { type: "string" },
      timezone: { type: ["string", "null"] },
      referenceDate: { type: ["string", "null"] },
    }),
    async execute(args, context) {
      const now = args.referenceDate ? new Date(`${args.referenceDate}T12:00:00`) : (context.now ?? new Date());
      return resolveDateExpression(args.expression, args.timezone ?? context.timezone, now);
    },
  }),
  defineTool({
    name: "propose_life_event",
    description: "Add a life event to temporary proposal state only.",
    schema: proposeLifeEventArgs,
    parameters: schemaObject({
      title: { type: "string" },
      description: { type: "string" },
      category: { type: "string", enum: ["moving", "travel", "purchase_return", "follow_up", "appointment", "document_renewal", "home_maintenance", "general"] },
      startDate: { type: ["string", "null"] },
      endDate: { type: ["string", "null"] },
    }, ["title", "description", "category", "startDate", "endDate"]),
    async execute(args, context) {
      context.builder.setLifeEvent(args);
      return { ok: true };
    },
  }),
  defineTool({
    name: "propose_task",
    description: "Add a task to temporary proposal state only.",
    schema: proposeTaskArgs,
    parameters: schemaObject({
      temporaryId: { type: ["string", "null"] },
      title: { type: "string" },
      description: { type: "string" },
      priority: { type: "string", enum: ["low", "medium", "high"] },
      dueDate: { type: ["string", "null"] },
    }),
    async execute(args, context) {
      context.builder.addTask(args);
      return { ok: true };
    },
  }),
  defineTool({
    name: "propose_reminder",
    description: "Add a reminder to temporary proposal state only.",
    schema: proposeReminderArgs,
    parameters: schemaObject({
      temporaryId: { type: ["string", "null"] },
      title: { type: "string" },
      remindAt: { type: "string" },
      relatedTaskId: { type: ["string", "null"] },
      relatedTaskIndex: { type: ["number", "null"] },
    }),
    async execute(args, context) {
      context.builder.addReminder(args);
      return { ok: true };
    },
  }),
  defineTool({
    name: "propose_waiting_item",
    description: "Add a waiting item to temporary proposal state only.",
    schema: proposeWaitingItemArgs,
    parameters: schemaObject({
      temporaryId: { type: ["string", "null"] },
      title: { type: "string" },
      description: { type: "string" },
      waitingOn: { type: "string" },
      expectedBy: { type: ["string", "null"] },
      followUpDate: { type: ["string", "null"] },
    }),
    async execute(args, context) {
      context.builder.addWaitingItem(args);
      return { ok: true };
    },
  }),
  defineTool({
    name: "ask_clarification",
    description: "Ask one focused clarification question and pause the run.",
    schema: askClarificationArgs,
    parameters: schemaObject({
      question: { type: "string" },
      missingFields: { type: "array", items: { type: "string" } },
      reason: { type: "string" },
    }),
    async execute(args, context) {
      context.builder.askClarification(args.question);
      context.builder.addAssumption(args.reason);
      return { ok: true, requiresClarification: true, question: args.question };
    },
  }),
  defineTool({
    name: "finalize_proposal",
    description: "Validate temporary proposal state and mark it ready for review.",
    schema: finalizeProposalArgs,
    parameters: schemaObject({
      summary: { type: "string" },
      category: { type: "string", enum: ["moving", "travel", "purchase_return", "follow_up", "appointment", "document_renewal", "home_maintenance", "general"] },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
    }),
    async execute(args, context) {
      return { ok: true, proposal: context.builder.finalize(args.summary, args.category, args.confidence) };
    },
  }),
];

export const toolDefinitions = tools.map((tool) => ({
  type: "function",
  name: tool.name,
  description: tool.description,
  parameters: tool.parameters,
  strict: true,
}));

export class AgentToolRegistry {
  private readonly byName = new Map(tools.map((tool) => [tool.name, tool]));
  private readonly seenCalls = new Set<string>();

  async execute(name: string, rawArgs: unknown, context: AgentToolContext, callId?: string): Promise<ToolCallLog> {
    const started = Date.now();
    const tool = this.byName.get(name);
    const args = typeof rawArgs === "object" && rawArgs ? (rawArgs as Record<string, unknown>) : {};
    try {
      if (!tool) throw new AgentToolError(`Unknown tool: ${name}`);
      const callKey = `${name}:${JSON.stringify(args)}`;
      if (this.seenCalls.has(callKey)) throw new AgentToolError(`Repeated identical tool call: ${name}`);
      this.seenCalls.add(callKey);
      const parsed = tool.schema.parse(args);
      const result = await tool.execute(parsed, context);
      return { name, callId, arguments: args, result, durationMs: Date.now() - started, success: true };
    } catch (error) {
      return {
        name,
        callId,
        arguments: args,
        result: { ok: false, error: "Tool execution failed." },
        durationMs: Date.now() - started,
        success: false,
        error: error instanceof Error ? error.message : "Tool execution failed.",
      };
    }
  }
}

export async function runTool(name: string, rawArgs: unknown, draft: ProposalDraft) {
  const builder = new ProposalBuilder();
  if (draft.lifeEvent) builder.setLifeEvent(draft.lifeEvent);
  draft.tasks.forEach((task) => builder.addTask(task));
  draft.reminders.forEach((reminder) => builder.addReminder(reminder));
  draft.waitingItems.forEach((item) => builder.addWaitingItem(item));
  const fakeRepository = {
    async getProfile() { return { name: "Demo User", timezone: "America/Toronto", reminderPreference: "Morning digest" }; },
    async listLifeEvents() { return []; },
    async listTasks() { return []; },
    async listWaitingItems() { return []; },
  } as unknown as DataRepository;
  const log = await new AgentToolRegistry().execute(name, rawArgs, {
    userId: "demo-user",
    repository: fakeRepository,
    builder,
    timezone: "America/Toronto",
  });
  return log.result;
}

export function inferProposalFromInput(input: string): AgentProposal {
  const lower = input.toLowerCase();
  const resolved = resolveDateExpression(input);
  if ((lower.includes("soon") || lower.includes("moving")) && resolved.requiresClarification && !/\b\d{1,2}\b/.test(input)) {
    return {
      version: 1,
      summary: "A move date is needed before creating a useful plan.",
      category: "moving",
      confidence: "low",
      assumptions: [],
      lifeEvent: { title: "Moving Plan", description: "Prepare for an upcoming move once the date is known.", category: "moving", startDate: null, endDate: null },
      tasks: [],
      reminders: [],
      waitingItems: [],
      clarificationQuestions: ["What date are you moving?"],
    };
  }
  const category = lower.includes("trip") || lower.includes("travel") || lower.includes("going to") ? "travel" : lower.includes("bought") || lower.includes("purchase") || lower.includes("return") ? "purchase_return" : lower.includes("move") || lower.includes("moving") ? "moving" : "general";
  return {
    version: 1,
    summary: `Created a ${category === "purchase_return" ? "purchase return" : category} plan.`,
    category,
    confidence: resolved.confidence,
    assumptions: resolved.requiresClarification ? [resolved.explanation] : [],
    lifeEvent: {
      title: category === "travel" ? "Upcoming Trip" : category === "purchase_return" ? "Purchase Return Window" : category === "moving" ? "Move to New House" : "Sonae Plan",
      description: "Organize the practical tasks, deadlines, and follow-ups for this situation.",
      category,
      startDate: todayISO(),
      endDate: resolved.endDate,
    },
    tasks: [
      { temporaryId: "task_1", title: category === "moving" ? "Update important addresses" : "Confirm next step", description: "Handle the most time-sensitive item first.", priority: "high", dueDate: resolved.endDate },
      { temporaryId: "task_2", title: category === "moving" ? "Transfer utilities and services" : "Set a follow-up reminder", description: "Reduce last-minute work by handling this ahead of the deadline.", priority: "medium", dueDate: resolved.endDate },
    ],
    reminders: [],
    waitingItems: [],
    clarificationQuestions: [],
  };
}
