import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD dates.");
const isoDateTime = z.string().datetime({ offset: true });

const proposalCategories = [
  "moving",
  "travel",
  "purchase_return",
  "follow_up",
  "appointment",
  "document_renewal",
  "home_maintenance",
  "bill_payment",
  "school_admin",
  "subscription",
  "insurance_claim",
  "career",
  "general",
  // Legacy categories accepted so previously created demo proposals remain readable.
  "purchase",
  "follow-up",
  "refund",
] as const;

function normalizeProposalCategory(value: unknown) {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, (typeof proposalCategories)[number]> = {
    move: "moving",
    relocation: "moving",
    purchase: "purchase_return",
    return: "purchase_return",
    refund: "purchase_return",
    followup: "follow_up",
    follow_up: "follow_up",
    follow: "follow_up",
    document: "document_renewal",
    renewal: "document_renewal",
    home: "home_maintenance",
    maintenance: "home_maintenance",
    bill: "bill_payment",
    payment: "bill_payment",
    rent: "bill_payment",
    tuition: "school_admin",
    school: "school_admin",
    enrollment: "school_admin",
    subscription: "subscription",
    membership: "subscription",
    insurance: "insurance_claim",
    claim: "insurance_claim",
    career: "career",
    job: "career",
    jobs: "career",
    internship: "career",
    internships: "career",
    interview: "career",
    interviews: "career",
    resume: "career",
    linkedin: "career",
  };

  return aliases[normalized] ?? normalized;
}

export const proposalCategorySchema = z.preprocess(normalizeProposalCategory, z.enum(proposalCategories));

export const proposalConfidenceSchema = z.enum(["low", "medium", "high"]);

function clampString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 3).trimEnd()}...`;
}

export const proposalTaskSchema = z.object({
  temporaryId: z.string().trim().min(2).max(60).optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: isoDate.nullable().optional(),
}).strict();

export const proposalReminderSchema = z.object({
  temporaryId: z.string().trim().min(2).max(60).optional(),
  title: z.string().trim().min(2).max(120),
  remindAt: isoDateTime,
  relatedTaskId: z.string().trim().min(2).max(60).nullable().optional(),
  relatedTaskIndex: z.number().int().min(0).nullable().optional(),
}).strict();

export const proposalWaitingItemSchema = z.object({
  temporaryId: z.string().trim().min(2).max(60).optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  waitingOn: z.string().trim().min(2).max(120),
  expectedBy: isoDate.nullable().optional(),
  followUpDate: isoDate.nullable().optional(),
}).strict();

export const agentProposalSchema = z
  .object({
    version: z.literal(1).default(1),
    summary: z.string().trim().min(2).max(500),
    category: proposalCategorySchema.default("general"),
    confidence: proposalConfidenceSchema.default("medium"),
    assumptions: z.array(z.preprocess((value) => clampString(value, 180), z.string().min(2).max(180))).max(5).default([]),
    lifeEvent: z.object({
      title: z.string().trim().min(2).max(120),
      description: z.string().trim().max(700).default(""),
      category: proposalCategorySchema.default("general"),
      startDate: isoDate.nullable().optional(),
      endDate: isoDate.nullable().optional(),
    }).strict(),
    tasks: z.array(proposalTaskSchema).max(12).default([]),
    reminders: z.array(proposalReminderSchema).max(5).default([]),
    waitingItems: z.array(proposalWaitingItemSchema).max(5).default([]),
    clarificationQuestions: z.array(z.string().trim().min(2).max(180)).max(3).default([]),
  })
  .strict()
  .superRefine((proposal, context) => {
    const startDate = proposal.lifeEvent.startDate;
    const endDate = proposal.lifeEvent.endDate;
    if (startDate && endDate && startDate > endDate) {
      context.addIssue({
        code: "custom",
        path: ["lifeEvent", "endDate"],
        message: "End date must be on or after the start date.",
      });
    }

    const hasUsefulItem =
      proposal.tasks.length > 0 ||
      proposal.reminders.length > 0 ||
      proposal.waitingItems.length > 0 ||
      proposal.clarificationQuestions.length > 0;
    if (!hasUsefulItem) {
      context.addIssue({
        code: "custom",
        path: ["tasks"],
        message: "A proposal needs at least one task, reminder, waiting item, or clarification question.",
      });
    }

    const taskIds = new Set(proposal.tasks.map((task, index) => task.temporaryId ?? `task_${index + 1}`));
    proposal.reminders.forEach((reminder, index) => {
      if (typeof reminder.relatedTaskIndex === "number" && !proposal.tasks[reminder.relatedTaskIndex]) {
        context.addIssue({
          code: "custom",
          path: ["reminders", index, "relatedTaskIndex"],
          message: "Reminder references a task that does not exist.",
        });
      }
      if (reminder.relatedTaskId && !taskIds.has(reminder.relatedTaskId)) {
        context.addIssue({
          code: "custom",
          path: ["reminders", index, "relatedTaskId"],
          message: "Reminder references a task ID that does not exist.",
        });
      }
    });

    proposal.tasks.forEach((task, index) => {
      if (task.dueDate && endDate && task.dueDate > endDate) {
        context.addIssue({
          code: "custom",
          path: ["tasks", index, "dueDate"],
          message: "Task due date should not be after the life event ends.",
        });
      }
    });
  });

export type AgentProposal = z.infer<typeof agentProposalSchema>;
export type ProposalTask = z.infer<typeof proposalTaskSchema>;
export type ProposalCategory = z.infer<typeof proposalCategorySchema>;

export const situationInputSchema = z.object({
  input: z.string().trim().min(4, "Describe what is happening.").max(2000),
  proposalId: z.string().optional(),
  clarificationAnswer: z.string().trim().max(1000).optional(),
});

export const approvalPayloadSchema = z.object({
  proposal: agentProposalSchema,
});
