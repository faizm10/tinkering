import "server-only";

import { addDays, addMonths } from "date-fns";

import { todayISO } from "@/lib/dates";
import { agentProposalSchema, type AgentProposal, type ProposalCategory } from "@/lib/validations/proposal";
import { detectDuplicateEvent, detectDuplicateTasks } from "@/server/agent/duplicate-detector";
import { AgentProviderError, AgentStepLimitError } from "@/server/agent/errors";
import { ProposalBuilder } from "@/server/agent/proposal-builder";
import { AgentToolRegistry } from "@/server/agent/tools";
import { resolveDateExpression } from "@/server/agent/date-resolver";
import { DEMO_USER_ID } from "@/server/providers/auth/demo-auth";
import { MemoryDataRepository } from "@/server/providers/data/memory-repository";
import type { AgentProvider, AgentProviderContext, AgentProviderResult, AgentProgressEvent, AgentProgressStage } from "@/server/providers/agent/provider";

function progressEvents(runId: string, stages: AgentProgressStage[]): AgentProgressEvent[] {
  const messages: Record<AgentProgressStage, string> = {
    understanding: "Understanding the situation.",
    checking_dates: "Checking the important dates.",
    reviewing_context: "Reviewing your current Sonae context.",
    organizing: "Organizing a proposed plan.",
    awaiting_clarification: "Waiting for one detail.",
    validating: "Validating the proposal.",
    ready: "Ready for review.",
    failed: "The run failed.",
  };
  return stages.map((type) => ({ runId, type, timestamp: new Date().toISOString(), message: messages[type] }));
}

function reminderBefore(date: string | null, title: string, relatedTaskId = "task_1") {
  if (!date) return [];
  return [{ temporaryId: "reminder_1", title, remindAt: `${todayISO(addDays(new Date(`${date}T12:00:00`), -7))}T09:00:00-04:00`, relatedTaskId }];
}

type Scenario = {
  category: ProposalCategory;
  title: string;
  summary: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  tasks: Array<{ title: string; description: string; priority: "low" | "medium" | "high"; dueDate: string | null }>;
  reminders?: AgentProposal["reminders"];
  waitingItems?: AgentProposal["waitingItems"];
  clarificationQuestion?: string;
  confidence?: "low" | "medium" | "high";
};

export class MockAgentProvider implements AgentProvider {
  async createProposal(input: string, context?: AgentProviderContext): Promise<AgentProviderResult> {
    const agentContext =
      context ??
      ({
        runId: "mock-run",
        userId: DEMO_USER_ID,
        repository: new MemoryDataRepository(),
      } satisfies AgentProviderContext);
    const lower = input.toLowerCase();
    if (lower.includes("simulate provider failure")) throw new AgentProviderError("Simulated mock provider failure.");
    if (lower.includes("simulate step limit")) throw new AgentStepLimitError("Simulated mock step limit.");

    const registry = new AgentToolRegistry();
    const builder = new ProposalBuilder();
    const profile = await agentContext.repository.getProfile(agentContext.userId);
    const toolContext = { userId: agentContext.userId, repository: agentContext.repository, builder, timezone: profile.timezone };
    const toolCalls = [
      await registry.execute("get_current_datetime", {}, toolContext, "mock_current_datetime"),
      await registry.execute("get_user_preferences", {}, toolContext, "mock_preferences"),
      await registry.execute("get_active_life_events", {}, toolContext, "mock_events"),
      await registry.execute("get_upcoming_tasks", {}, toolContext, "mock_tasks"),
    ];

    const scenario = buildScenario(input);
    await registry.execute("resolve_date_expression", { expression: input, timezone: profile.timezone }, toolContext, "mock_resolve_date").then((call) => toolCalls.push(call));
    await registry.execute(
      "propose_life_event",
      {
        title: scenario.title,
        description: scenario.description,
        category: scenario.category,
        startDate: scenario.startDate,
        endDate: scenario.endDate,
      },
      toolContext,
      "mock_life_event",
    ).then((call) => toolCalls.push(call));

    scenario.tasks.forEach((task, index) => {
      void builder.addTask({ temporaryId: `task_${index + 1}`, ...task });
    });
    scenario.reminders?.forEach((reminder) => builder.addReminder(reminder));
    scenario.waitingItems?.forEach((item) => builder.addWaitingItem(item));
    if (scenario.clarificationQuestion) builder.askClarification(scenario.clarificationQuestion);

    const proposal = agentProposalSchema.parse(builder.finalize(scenario.summary, scenario.category, scenario.confidence ?? "high"));
    const events = await agentContext.repository.listLifeEvents(agentContext.userId);
    const tasks = await agentContext.repository.listTasks(agentContext.userId);
    const duplicateEvent = detectDuplicateEvent(proposal, events);
    const duplicateTasks = detectDuplicateTasks(proposal, tasks);
    const finalProposal = duplicateEvent || duplicateTasks.length
      ? agentProposalSchema.parse({
          ...proposal,
          assumptions: [
            ...proposal.assumptions,
            ...(duplicateEvent ? [`Possible duplicate life event: ${duplicateEvent.title}.`] : []),
            ...duplicateTasks.map((task) => `Possible duplicate task: ${task.title}.`),
          ],
        })
      : proposal;

    toolCalls.push({
      name: scenario.clarificationQuestion ? "ask_clarification" : "finalize_proposal",
      callId: "mock_finalize",
      arguments: scenario.clarificationQuestion ? { question: scenario.clarificationQuestion } : { summary: scenario.summary },
      result: scenario.clarificationQuestion ? { ok: true, question: scenario.clarificationQuestion } : { ok: true },
      durationMs: 0,
      success: true,
    });

    const progress = scenario.clarificationQuestion
      ? (["understanding", "checking_dates", "reviewing_context", "awaiting_clarification"] as AgentProgressStage[])
      : (["understanding", "checking_dates", "reviewing_context", "organizing", "validating", "ready"] as AgentProgressStage[]);

    return {
      proposal: finalProposal,
      provider: "mock",
      model: "mock-sonae-v1",
      stepCount: toolCalls.length,
      progress,
      progressEvents: progressEvents(agentContext.runId, progress),
      toolCalls,
      usage: null,
    };
  }
}

export function buildMockProposal(input: string): AgentProposal {
  const scenario = buildScenario(input);
  return agentProposalSchema.parse({
    version: 1,
    summary: scenario.summary,
    category: scenario.category,
    confidence: scenario.confidence ?? "high",
    assumptions: [],
    lifeEvent: {
      title: scenario.title,
      description: scenario.description,
      category: scenario.category,
      startDate: scenario.startDate,
      endDate: scenario.endDate,
    },
    tasks: scenario.tasks.map((task, index) => ({ temporaryId: `task_${index + 1}`, ...task })),
    reminders: scenario.reminders ?? [],
    waitingItems: scenario.waitingItems ?? [],
    clarificationQuestions: scenario.clarificationQuestion ? [scenario.clarificationQuestion] : [],
  });
}

function buildScenario(input: string): Scenario {
  const lower = input.toLowerCase();
  const clarified = lower.includes("clarification:");
  const resolved = resolveDateExpression(input);

  if (!clarified && !resolved.endDate && (lower.includes("moving soon") || (lower.includes("move") && lower.includes("soon")))) {
    return {
      category: "moving",
      title: "Moving Plan",
      summary: "Sonae needs the moving date before drafting the plan.",
      description: "Prepare for an upcoming move once the date is known.",
      startDate: null,
      endDate: null,
      tasks: [],
      clarificationQuestion: "What date are you moving?",
      confidence: "low",
    };
  }

  if (lower.includes("move") || lower.includes("moving")) {
    const endDate = resolved.endDate ?? resolveDateExpression("September 1").endDate;
    return {
      category: "moving",
      title: "Move to New House",
      summary: "Created a moving plan for September 1.",
      description: "Prepare for the upcoming move.",
      startDate: todayISO(),
      endDate,
      tasks: [
        ["Update banking address", "Update the address connected to banking accounts.", "high"],
        ["Transfer internet service", "Schedule the internet transfer or new installation.", "high"],
        ["Update important accounts", "Change addresses for school, work, insurance, and subscriptions.", "medium"],
        ["Change delivery addresses", "Update saved addresses for delivery and shopping accounts.", "medium"],
        ["Pack essential belongings", "Pack the items needed for the first night in the new place.", "medium"],
      ].map(([title, description, priority]) => ({ title, description, priority: priority as "low" | "medium" | "high", dueDate: endDate })),
      reminders: reminderBefore(endDate, "Prepare address updates"),
    };
  }

  if (lower.includes("new york") || lower.includes("trip") || lower.includes("travelling") || lower.includes("travel")) {
    const startDate = resolved.startDate ?? "2026-08-16";
    const endDate = resolved.endDate ?? "2026-08-20";
    return {
      category: "travel",
      title: "New York Trip",
      summary: "Created a travel plan for the New York trip.",
      description: "Prepare logistics, documents, and packing before travelling.",
      startDate,
      endDate,
      tasks: ["Confirm flight details", "Confirm accommodation", "Prepare travel documents", "Create packing list", "Complete check-in"].map((title, index) => ({
        title,
        description: "Handle this before departure so travel day stays calm.",
        priority: index < 2 ? "high" : "medium",
        dueDate: index === 4 ? todayISO(addDays(new Date(`${startDate}T12:00:00`), -1)) : startDate,
      })),
      reminders: reminderBefore(startDate, "Review trip preparation"),
    };
  }

  if (lower.includes("headphones") || lower.includes("return") || lower.includes("bought")) {
    const deadline = lower.includes("30 days") ? todayISO(addDays(new Date(), 30)) : (resolved.endDate ?? todayISO(addDays(new Date(), 30)));
    return {
      category: "purchase_return",
      title: "Headphones Purchase",
      summary: "Created a return-window plan for the headphones.",
      description: "Test the headphones and decide before the return deadline.",
      startDate: todayISO(),
      endDate: deadline,
      tasks: [
        { title: "Test the headphones", description: "Use them in realistic conditions.", priority: "medium", dueDate: todayISO(addDays(new Date(), 7)) },
        { title: "Decide whether to keep them", description: "Make the keep-or-return decision before the window closes.", priority: "high", dueDate: todayISO(addDays(new Date(), 25)) },
        { title: "Return them if necessary", description: "Package and drop off the headphones if they are not worth keeping.", priority: "high", dueDate: deadline },
      ],
      reminders: reminderBefore(deadline, "Return deadline approaching"),
    };
  }

  if (lower.includes("bill") || lower.includes("rent") || lower.includes("invoice") || lower.includes("payment due")) {
    const dueDate = resolved.endDate ?? resolveDateExpression("Friday").endDate;
    const reminderDate = dueDate ? todayISO(addDays(new Date(`${dueDate}T12:00:00`), -1)) : null;
    return {
      category: "bill_payment",
      title: lower.includes("rent") ? "Rent Payment" : "Bill Payment",
      summary: "Created a bill-payment plan.",
      description: "Track the payment deadline and keep confirmation after paying.",
      startDate: todayISO(),
      endDate: dueDate,
      tasks: [
        { title: "Review the amount due", description: "Check the bill amount, due date, and payment method.", priority: "high", dueDate: reminderDate ?? dueDate },
        { title: "Make the payment", description: "Pay through the correct account or portal before the deadline.", priority: "high", dueDate },
        { title: "Save payment confirmation", description: "Keep the receipt or confirmation number for records.", priority: "medium", dueDate },
      ],
      reminders: reminderBefore(dueDate, "Payment deadline approaching"),
    };
  }

  if (lower.includes("tuition") || lower.includes("enroll") || lower.includes("enrollment") || lower.includes("registration") || (lower.includes("school") && (lower.includes("form") || lower.includes("paperwork") || lower.includes("deadline")))) {
    const dueDate = resolved.endDate ?? resolveDateExpression("end of month").endDate;
    return {
      category: "school_admin",
      title: "School Admin Deadline",
      summary: "Created a school administration plan.",
      description: "Organize forms, payment, and confirmation before the school deadline.",
      startDate: todayISO(),
      endDate: dueDate,
      tasks: [
        { title: "Review required forms", description: "Confirm which forms, IDs, or portal steps are required.", priority: "high", dueDate },
        { title: "Submit school paperwork", description: "Complete the required school forms before the deadline.", priority: "high", dueDate },
        { title: "Save submission confirmation", description: "Keep a screenshot, receipt, or confirmation email.", priority: "medium", dueDate },
      ],
      reminders: reminderBefore(dueDate, "School deadline approaching"),
    };
  }

  if (lower.includes("subscription") || lower.includes("membership") || lower.includes("trial") || lower.includes("gym")) {
    const dueDate = resolved.endDate ?? resolveDateExpression("in two weeks").endDate;
    return {
      category: "subscription",
      title: "Subscription Review",
      summary: "Created a subscription review plan.",
      description: "Review renewal terms and cancel or keep the subscription before the deadline.",
      startDate: todayISO(),
      endDate: dueDate,
      tasks: [
        { title: "Check renewal terms", description: "Confirm the renewal date, price, and cancellation rules.", priority: "high", dueDate },
        { title: "Decide whether to keep it", description: "Choose whether the subscription is still worth keeping.", priority: "high", dueDate },
        { title: "Save account confirmation", description: "Keep proof of any account change or cancellation confirmation.", priority: "medium", dueDate },
      ],
      reminders: reminderBefore(dueDate, "Subscription deadline approaching"),
      waitingItems: lower.includes("support")
        ? [{ temporaryId: "waiting_1", title: "Support confirmation", description: "Waiting for support to confirm the account change.", waitingOn: "Support", expectedBy: dueDate, followUpDate: dueDate }]
        : [],
    };
  }

  if (lower.includes("insurance") || lower.includes("claim") || lower.includes("adjuster")) {
    const dueDate = resolved.endDate ?? todayISO(addDays(new Date(), 7));
    return {
      category: "insurance_claim",
      title: "Insurance Claim",
      summary: "Created an insurance claim follow-up plan.",
      description: "Track claim documents, follow-up timing, and any response from the insurer.",
      startDate: todayISO(),
      endDate: dueDate,
      tasks: [
        { title: "Gather claim documents", description: "Collect photos, receipts, policy details, and claim numbers.", priority: "high", dueDate },
        { title: "Check claim status", description: "Review the insurer portal or latest message for the next required step.", priority: "high", dueDate },
        { title: "Record claim reference", description: "Save the claim number and any adjuster contact details.", priority: "medium", dueDate },
      ],
      reminders: reminderBefore(dueDate, "Insurance claim follow-up"),
      waitingItems: [{ temporaryId: "waiting_1", title: "Insurer response", description: "Waiting for the insurer or adjuster to respond.", waitingOn: "Insurance company", expectedBy: dueDate, followUpDate: dueDate }],
    };
  }

  if (lower.includes("landlord") || lower.includes("follow up") || lower.includes("emailed")) {
    const followUpDate = resolved.endDate ?? resolveDateExpression("next Monday").endDate;
    return {
      category: "follow_up",
      title: "Landlord Follow-Up",
      summary: "Created a follow-up plan for the landlord response.",
      description: "Track the reply and follow up if needed.",
      startDate: todayISO(),
      endDate: followUpDate,
      tasks: [{ title: "Follow up with landlord", description: "Send a concise follow-up if there is no reply.", priority: "high", dueDate: followUpDate }],
      reminders: reminderBefore(followUpDate, "Landlord follow-up"),
      waitingItems: [{ temporaryId: "waiting_1", title: "Landlord response", description: "Waiting for the landlord to reply.", waitingOn: "Landlord", expectedBy: followUpDate, followUpDate }],
    };
  }

  if (lower.includes("dentist") || lower.includes("appointment")) {
    const date = resolved.endDate ?? resolveDateExpression("September 10").endDate;
    return {
      category: "appointment",
      title: "Dentist Appointment",
      summary: "Created an appointment preparation plan.",
      description: "Prepare for the upcoming appointment.",
      startDate: date,
      endDate: date,
      tasks: [{ title: "Confirm appointment details", description: "Check the appointment time, location, and any forms.", priority: "medium", dueDate: date }],
      reminders: reminderBefore(date, "Dentist appointment reminder"),
    };
  }

  if (lower.includes("passport") || lower.includes("expires")) {
    const date = todayISO(addMonths(new Date(), 6));
    return {
      category: "document_renewal",
      title: "Passport Renewal",
      summary: "Created a document renewal plan.",
      description: "Track renewal steps before the document expires.",
      startDate: todayISO(),
      endDate: date,
      tasks: [
        { title: "Check renewal requirements", description: "Review the official renewal requirements.", priority: "high", dueDate: todayISO(addMonths(new Date(), 4)) },
        { title: "Gather renewal documents", description: "Collect photos, forms, and supporting documents.", priority: "medium", dueDate: todayISO(addMonths(new Date(), 5)) },
      ],
      reminders: reminderBefore(date, "Passport expiration approaching"),
    };
  }

  if (lower.includes("air conditioner") || lower.includes("maintenance")) {
    const date = resolved.endDate ?? todayISO(addMonths(new Date(), 1));
    return {
      category: "home_maintenance",
      title: "Air Conditioner Maintenance",
      summary: "Created a home maintenance plan.",
      description: "Schedule and track maintenance for the air conditioner.",
      startDate: todayISO(),
      endDate: date,
      tasks: [{ title: "Schedule maintenance", description: "Find a suitable maintenance window.", priority: "medium", dueDate: date }],
      reminders: reminderBefore(date, "Schedule AC maintenance"),
    };
  }

  return {
    category: "general",
    title: "Sonae Plan",
    summary: "Created a practical personal admin plan.",
    description: "Organize the practical next steps for this situation.",
    startDate: todayISO(),
    endDate: resolved.endDate,
    confidence: resolved.confidence,
    tasks: [
      { title: "Confirm the next step", description: "Clarify what needs to happen first.", priority: "medium", dueDate: resolved.endDate },
      { title: "Set a follow-up", description: "Check back before the relevant deadline.", priority: "medium", dueDate: resolved.endDate },
    ],
    reminders: reminderBefore(resolved.endDate, "Review this personal admin plan"),
  };
}
