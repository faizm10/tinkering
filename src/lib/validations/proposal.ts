import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD dates.");
const isoDateTime = z.string().datetime({ offset: true });

export const proposalTaskSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: isoDate.nullable().optional(),
});

export const proposalReminderSchema = z.object({
  title: z.string().trim().min(2).max(120),
  remindAt: isoDateTime,
  relatedTaskIndex: z.number().int().min(0).nullable().optional(),
});

export const proposalWaitingItemSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  waitingOn: z.string().trim().min(2).max(120),
  expectedBy: isoDate.nullable().optional(),
  followUpDate: isoDate.nullable().optional(),
});

export const agentProposalSchema = z
  .object({
    summary: z.string().trim().min(2).max(500),
    lifeEvent: z.object({
      title: z.string().trim().min(2).max(120),
      description: z.string().trim().max(700).default(""),
      category: z.string().trim().min(2).max(40).default("general"),
      startDate: isoDate.nullable().optional(),
      endDate: isoDate.nullable().optional(),
    }),
    tasks: z.array(proposalTaskSchema).max(12).default([]),
    reminders: z.array(proposalReminderSchema).max(5).default([]),
    waitingItems: z.array(proposalWaitingItemSchema).max(5).default([]),
    clarificationQuestions: z.array(z.string().trim().min(2).max(180)).max(3).default([]),
  })
  .strict();

export type AgentProposal = z.infer<typeof agentProposalSchema>;
export type ProposalTask = z.infer<typeof proposalTaskSchema>;

export const situationInputSchema = z.object({
  input: z.string().trim().min(4, "Describe what is happening.").max(2000),
  proposalId: z.string().optional(),
  clarificationAnswer: z.string().trim().max(1000).optional(),
});

export const approvalPayloadSchema = z.object({
  proposal: agentProposalSchema,
});
