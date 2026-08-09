import { z } from "zod";
import { parseNaturalDate, todayISO } from "@/lib/dates";
import type { AgentProposal } from "@/lib/validations/proposal";

export type ToolCallLog = {
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
};

export type ProposalDraft = Partial<AgentProposal> & {
  tasks: AgentProposal["tasks"];
  reminders: AgentProposal["reminders"];
  waitingItems: AgentProposal["waitingItems"];
  clarificationQuestions: string[];
};

export function emptyDraft(): ProposalDraft {
  return {
    tasks: [],
    reminders: [],
    waitingItems: [],
    clarificationQuestions: [],
  };
}

const proposeLifeEventArgs = z.object({
  title: z.string().min(2),
  description: z.string().default(""),
  category: z.string().default("general"),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

const proposeTaskArgs = z.object({
  title: z.string().min(2),
  description: z.string().default(""),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().nullable().optional(),
});

const askClarificationArgs = z.object({
  question: z.string().min(2).max(180),
});

export const toolDefinitions = [
  {
    type: "function",
    name: "get_current_date",
    description: "Return the current date for the user's timezone.",
    parameters: { type: "object", additionalProperties: false, properties: {} },
  },
  {
    type: "function",
    name: "propose_life_event",
    description: "Add a life event to the temporary proposal.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        category: { type: "string" },
        startDate: { type: ["string", "null"] },
        endDate: { type: ["string", "null"] },
      },
      required: ["title", "description", "category", "startDate", "endDate"],
    },
  },
  {
    type: "function",
    name: "propose_task",
    description: "Add an actionable task to the temporary proposal.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        dueDate: { type: ["string", "null"] },
      },
      required: ["title", "description", "priority", "dueDate"],
    },
  },
  {
    type: "function",
    name: "ask_clarification",
    description: "Ask the user for a missing required detail and stop.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        question: { type: "string" },
      },
      required: ["question"],
    },
  },
] as const;

export function runTool(name: string, rawArgs: unknown, draft: ProposalDraft) {
  if (name === "get_current_date") {
    return { currentDate: todayISO() };
  }

  if (name === "propose_life_event") {
    const args = proposeLifeEventArgs.parse(rawArgs);
    draft.lifeEvent = args;
    return { ok: true };
  }

  if (name === "propose_task") {
    const args = proposeTaskArgs.parse(rawArgs);
    draft.tasks.push(args);
    return { ok: true };
  }

  if (name === "ask_clarification") {
    const args = askClarificationArgs.parse(rawArgs);
    draft.clarificationQuestions = [args.question];
    return { ok: true, requiresClarification: true };
  }

  throw new Error(`Unsupported tool: ${name}`);
}

export function inferProposalFromInput(input: string): AgentProposal {
  const date = parseNaturalDate(input);
  const lower = input.toLowerCase();

  if ((lower.includes("soon") || lower.includes("moving")) && !date && !/\b\d{1,2}\b/.test(input)) {
    return {
      summary: "A move date is needed before creating a useful plan.",
      lifeEvent: {
        title: "Moving Plan",
        description: "Prepare for an upcoming move once the date is known.",
        category: "moving",
        startDate: null,
        endDate: null,
      },
      tasks: [],
      reminders: [],
      waitingItems: [],
      clarificationQuestions: ["What date are you moving?"],
    };
  }

  if (lower.includes("refund")) {
    return {
      summary: "Created a follow-up plan for the refund.",
      lifeEvent: {
        title: "Refund Follow-Up",
        description: "Track the refund request and follow up if it is not resolved.",
        category: "refund",
        startDate: todayISO(),
        endDate: date,
      },
      tasks: [
        {
          title: "Check refund status",
          description: "Review the latest status from the company or payment method.",
          priority: "medium",
          dueDate: date,
        },
      ],
      reminders: [],
      waitingItems: [
        {
          title: "Waiting for refund",
          description: "The company still needs to process the refund.",
          waitingOn: "Company support",
          expectedBy: date,
          followUpDate: date,
        },
      ],
      clarificationQuestions: [],
    };
  }

  const isTrip = lower.includes("trip") || lower.includes("travel") || lower.includes("going to");
  const isPurchase = lower.includes("bought") || lower.includes("purchase") || lower.includes("return");
  const isMove = lower.includes("move") || lower.includes("moving");

  return {
    summary: `Created a ${isTrip ? "travel" : isPurchase ? "purchase" : isMove ? "moving" : "life admin"} plan.`,
    lifeEvent: {
      title: isTrip ? "Upcoming Trip" : isPurchase ? "Purchase Return Window" : isMove ? "Move to New House" : "Life Admin Plan",
      description: "Organize the practical tasks, deadlines, and follow-ups for this situation.",
      category: isTrip ? "travel" : isPurchase ? "purchase" : isMove ? "moving" : "general",
      startDate: todayISO(),
      endDate: date,
    },
    tasks: [
      {
        title: isTrip ? "Confirm bookings" : isPurchase ? "Test the purchase" : isMove ? "Update important addresses" : "Confirm next step",
        description: "Handle the most time-sensitive item first.",
        priority: "high",
        dueDate: date,
      },
      {
        title: isTrip ? "Prepare travel documents" : isPurchase ? "Decide whether to keep it" : isMove ? "Transfer utilities and services" : "Set a follow-up reminder",
        description: "Reduce last-minute work by handling this ahead of the deadline.",
        priority: "medium",
        dueDate: date,
      },
    ],
    reminders: [],
    waitingItems: [],
    clarificationQuestions: [],
  };
}
