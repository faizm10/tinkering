import "server-only";

import { addDays } from "date-fns";
import { agentProposalSchema, type AgentProposal } from "@/lib/validations/proposal";
import { parseNaturalDate, todayISO } from "@/lib/dates";
import type { AgentProvider, AgentProviderResult } from "@/server/providers/agent/provider";

function reminderBefore(date: string | null, title: string) {
  if (!date) return [];
  return [
    {
      title,
      remindAt: `${todayISO(addDays(new Date(`${date}T12:00:00`), -7))}T09:00:00-04:00`,
      relatedTaskIndex: 0,
    },
  ];
}

export class MockAgentProvider implements AgentProvider {
  async createProposal(input: string): Promise<AgentProviderResult> {
    const proposal = agentProposalSchema.parse(buildMockProposal(input));
    return {
      proposal,
      provider: "mock",
      model: "mock-life-admin-v1",
      stepCount: proposal.clarificationQuestions.length ? 3 : 5,
      progress: proposal.clarificationQuestions.length
        ? ["understanding", "checking_dates", "ready"]
        : ["understanding", "checking_dates", "reviewing_context", "organizing", "ready"],
      toolCalls: [
        { name: "get_current_date", arguments: {}, result: { currentDate: todayISO() } },
        { name: "get_user_preferences", arguments: {}, result: { timezone: "America/Toronto" } },
        {
          name: proposal.clarificationQuestions.length ? "ask_clarification" : "propose_life_event",
          arguments: {},
          result: proposal.clarificationQuestions.length ? { question: proposal.clarificationQuestions[0] } : { title: proposal.lifeEvent.title },
        },
      ],
    };
  }
}

export function buildMockProposal(input: string): AgentProposal {
  const lower = input.toLowerCase();
  const explicitDate = parseNaturalDate(input);

  if (!explicitDate && (lower.includes("moving soon") || (lower.includes("move") && lower.includes("soon")))) {
    return {
      summary: "Life Admin needs the moving date before drafting the plan.",
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

  if (lower.includes("move") || lower.includes("moving")) {
    const endDate = explicitDate ?? parseNaturalDate("September 1");
    return {
      summary: "Created a moving plan for September 1.",
      lifeEvent: {
        title: "Move to New House",
        description: "Prepare for the upcoming move.",
        category: "moving",
        startDate: todayISO(),
        endDate,
      },
      tasks: [
        ["Update banking address", "Update the address connected to banking accounts.", "high"],
        ["Transfer internet service", "Schedule the internet transfer or new installation.", "high"],
        ["Update important accounts", "Change addresses for school, work, insurance, and subscriptions.", "medium"],
        ["Change delivery addresses", "Update saved addresses for delivery and shopping accounts.", "medium"],
        ["Pack essential belongings", "Pack the items needed for the first night in the new place.", "medium"],
      ].map(([title, description, priority]) => ({
        title,
        description,
        priority: priority as "low" | "medium" | "high",
        dueDate: endDate,
      })),
      reminders: reminderBefore(endDate, "Prepare address updates"),
      waitingItems: [],
      clarificationQuestions: [],
    };
  }

  if (lower.includes("new york") || lower.includes("trip") || lower.includes("travelling") || lower.includes("travel")) {
    return {
      summary: "Created a travel plan for the New York trip.",
      lifeEvent: {
        title: "New York Trip",
        description: "Prepare logistics, documents, and packing before travelling.",
        category: "travel",
        startDate: "2026-08-16",
        endDate: "2026-08-20",
      },
      tasks: [
        "Confirm flight details",
        "Confirm accommodation",
        "Prepare travel documents",
        "Create packing list",
        "Complete check-in",
      ].map((title, index) => ({
        title,
        description: "Handle this before departure so travel day stays calm.",
        priority: index < 2 ? "high" : "medium",
        dueDate: index === 4 ? "2026-08-15" : "2026-08-16",
      })) as AgentProposal["tasks"],
      reminders: reminderBefore("2026-08-16", "Review trip preparation"),
      waitingItems: [],
      clarificationQuestions: [],
    };
  }

  if (lower.includes("headphones") || lower.includes("return") || lower.includes("bought")) {
    const deadline = todayISO(addDays(new Date(), 30));
    return {
      summary: "Created a return-window plan for the headphones.",
      lifeEvent: {
        title: "Headphones Purchase",
        description: "Test the headphones and decide before the return deadline.",
        category: "purchase",
        startDate: todayISO(),
        endDate: deadline,
      },
      tasks: [
        { title: "Test the headphones", description: "Use them in realistic conditions.", priority: "medium", dueDate: todayISO(addDays(new Date(), 7)) },
        { title: "Decide whether to keep them", description: "Make the keep-or-return decision before the window closes.", priority: "high", dueDate: todayISO(addDays(new Date(), 25)) },
        { title: "Return them if necessary", description: "Package and drop off the headphones if they are not worth keeping.", priority: "high", dueDate: deadline },
      ],
      reminders: reminderBefore(deadline, "Return deadline approaching"),
      waitingItems: [],
      clarificationQuestions: [],
    };
  }

  if (lower.includes("landlord") || lower.includes("follow up") || lower.includes("emailed")) {
    const followUpDate = parseNaturalDate(input) ?? parseNaturalDate("next Monday");
    return {
      summary: "Created a follow-up plan for the landlord response.",
      lifeEvent: {
        title: "Landlord Follow-Up",
        description: "Track the reply and follow up if needed.",
        category: "follow-up",
        startDate: todayISO(),
        endDate: followUpDate,
      },
      tasks: [
        {
          title: "Follow up with landlord",
          description: "Send a concise follow-up if there is no reply.",
          priority: "high",
          dueDate: followUpDate,
        },
      ],
      reminders: reminderBefore(followUpDate, "Landlord follow-up"),
      waitingItems: [
        {
          title: "Landlord response",
          description: "Waiting for the landlord to reply.",
          waitingOn: "Landlord",
          expectedBy: followUpDate,
          followUpDate,
        },
      ],
      clarificationQuestions: [],
    };
  }

  return {
    summary: "Created a practical life-admin plan.",
    lifeEvent: {
      title: "Life Admin Plan",
      description: "Organize the practical next steps for this situation.",
      category: "general",
      startDate: todayISO(),
      endDate: explicitDate,
    },
    tasks: [
      { title: "Confirm the next step", description: "Clarify what needs to happen first.", priority: "medium", dueDate: explicitDate },
      { title: "Set a follow-up", description: "Check back before the relevant deadline.", priority: "medium", dueDate: explicitDate },
    ],
    reminders: reminderBefore(explicitDate, "Review this life admin plan"),
    waitingItems: [],
    clarificationQuestions: [],
  };
}
