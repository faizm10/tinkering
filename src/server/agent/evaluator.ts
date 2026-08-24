import { agentProposalSchema, type ProposalCategory } from "@/lib/validations/proposal";
import { resolveDateExpression } from "@/server/agent/date-resolver";
import { MockAgentProvider } from "@/server/providers/agent/mock-agent";
import { DEMO_USER_ID } from "@/server/providers/auth/demo-auth";
import { MemoryDataRepository } from "@/server/providers/data/memory-repository";

export type AgentEvalCase = {
  name: string;
  input: string;
  expectedCategory?: ProposalCategory;
  expectsClarification?: boolean;
  expectedTools?: string[];
};

export const agentEvalCases: AgentEvalCase[] = [
  { name: "clear moving request", input: "I’m moving on September 1.", expectedCategory: "moving", expectedTools: ["get_active_life_events", "resolve_date_expression"] },
  { name: "moving without date", input: "I’m moving soon.", expectedCategory: "moving", expectsClarification: true, expectedTools: ["ask_clarification"] },
  { name: "clear travel request", input: "I have a trip coming up.", expectedCategory: "travel" },
  { name: "travel date range", input: "I’m going to New York from August 16 to August 20.", expectedCategory: "travel" },
  { name: "purchase return deadline", input: "I bought headphones today and have 30 days to return them.", expectedCategory: "purchase_return" },
  { name: "follow-up relative date", input: "I emailed my landlord and need to follow up next Monday.", expectedCategory: "follow_up" },
  { name: "appointment", input: "I have a dentist appointment on September 10.", expectedCategory: "appointment" },
  { name: "document renewal", input: "My passport expires in six months.", expectedCategory: "document_renewal" },
  { name: "home maintenance", input: "The air conditioner needs maintenance next month.", expectedCategory: "home_maintenance" },
  { name: "bill payment deadline", input: "My rent payment is due by Friday.", expectedCategory: "bill_payment" },
  { name: "school admin paperwork", input: "I need to submit school registration forms by the end of month.", expectedCategory: "school_admin" },
  { name: "subscription review", input: "My gym membership trial renews in two weeks and I need to decide whether to keep it.", expectedCategory: "subscription" },
  { name: "insurance claim follow-up", input: "I filed an insurance claim and need to follow up with the adjuster next Friday.", expectedCategory: "insurance_claim" },
  { name: "generic request", input: "I need to organize everything before school starts.", expectedCategory: "general" },
  { name: "irrelevant input", input: "This is just a random note.", expectedCategory: "general" },
  { name: "empty-ish input", input: "....", expectedCategory: "general" },
  { name: "ambiguous date", input: "I need this handled soon.", expectedCategory: "general" },
  { name: "past date rolls forward", input: "I’m moving on January 1.", expectedCategory: "moving" },
  { name: "duplicate event", input: "I’m moving on September 1.", expectedCategory: "moving" },
  { name: "duplicate task", input: "I need to follow up with landlord next Monday.", expectedCategory: "follow_up" },
  { name: "too many proposed tasks guard", input: "I need to organize everything before school starts.", expectedCategory: "general" },
  { name: "invalid reminder reference guard", input: "I’m moving on September 1.", expectedCategory: "moving" },
  { name: "provider timeout scenario placeholder", input: "I need to organize everything before school starts.", expectedCategory: "general" },
  { name: "malformed output guard", input: "I need to organize everything before school starts.", expectedCategory: "general" },
  { name: "unknown tool guard", input: "I need to organize everything before school starts.", expectedCategory: "general" },
  { name: "repeated tool call guard", input: "I need to organize everything before school starts.", expectedCategory: "general" },
  { name: "step limit scenario", input: "I need to organize everything before school starts.", expectedCategory: "general" },
  { name: "clarification continuation", input: "I’m moving soon.\nClarification: September 1.", expectedCategory: "moving" },
  { name: "user cancellation placeholder", input: "I changed my mind but keep a generic note.", expectedCategory: "general" },
];

export type AgentEvalResult = {
  name: string;
  passed: boolean;
  failures: string[];
};

export async function runAgentEvaluations(cases = agentEvalCases): Promise<AgentEvalResult[]> {
  const provider = new MockAgentProvider();
  const repository = new MemoryDataRepository();

  return Promise.all(
    cases.map(async (testCase, index) => {
      const userId = `${DEMO_USER_ID}-eval-${index}`;
      const failures: string[] = [];
      const before = await repository.getDashboardData(userId);
      const result = await provider.createProposal(testCase.input, {
        runId: `eval-${index}`,
        userId,
        repository,
      });
      const proposal = agentProposalSchema.safeParse(result.proposal);
      if (!proposal.success) failures.push("Proposal schema validation failed.");
      if (testCase.expectedCategory && proposal.success && proposal.data.category !== testCase.expectedCategory) {
        failures.push(`Expected category ${testCase.expectedCategory}, got ${proposal.data.category}.`);
      }
      if (typeof testCase.expectsClarification === "boolean" && proposal.success) {
        const clarified = proposal.data.clarificationQuestions.length > 0;
        if (clarified !== testCase.expectsClarification) failures.push("Clarification behaviour did not match expectation.");
      }
      for (const toolName of testCase.expectedTools ?? []) {
        if (!result.toolCalls.some((call) => call.name === toolName)) failures.push(`Missing expected tool ${toolName}.`);
      }
      if (result.proposal.tasks.length > 12 || result.proposal.reminders.length > 5 || result.proposal.waitingItems.length > 5) {
        failures.push("Proposal exceeded item limits.");
      }
      const after = await repository.getDashboardData(userId);
      if (after.lifeEvents.length !== before.lifeEvents.length || after.today.length !== before.today.length) {
        failures.push("Agent wrote permanent records before approval.");
      }
      if (resolveDateExpression(testCase.input).requiresClarification && !result.proposal.clarificationQuestions.length && testCase.expectsClarification) {
        failures.push("Date resolution required clarification but proposal did not ask.");
      }
      return { name: testCase.name, passed: failures.length === 0, failures };
    }),
  );
}
