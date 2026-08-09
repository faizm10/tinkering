import type { AgentStage } from "@/components/agent/agent-timeline";

/**
 * One dataset behind both the hero demonstration and the use-case switcher, so
 * the examples on the page never drift apart. Every plan here matches the shape
 * the real agent returns (`AgentProposal`): one life event, tasks with a
 * priority and a due date, optional reminders and waiting items.
 */
export type DemoTask = {
  title: string;
  due: string;
  priority?: "high";
};

export type DemoPlan = {
  id: string;
  /** Label on the use-case selector. */
  label: string;
  /** What the user typed. */
  input: string;
  /** The life event the agent proposes. */
  event: { title: string; dates: string };
  tasks: DemoTask[];
  reminder?: string;
  waiting?: { title: string; on: string };
  /** Only the stages this run would actually have gone through. */
  stages: AgentStage[];
};

export const demoPlans: DemoPlan[] = [
  {
    id: "moving",
    label: "Moving",
    input: "I’m moving to a new house on September 1.",
    event: { title: "Move to New House", dates: "Aug 9 – Sep 1" },
    tasks: [
      { title: "Update banking address", due: "Aug 25", priority: "high" },
      { title: "Transfer internet service", due: "Aug 27" },
      { title: "Change delivery addresses", due: "Aug 30" },
      { title: "Pack desk equipment", due: "Aug 31" },
    ],
    reminder: "Follow up with internet provider",
    stages: ["understanding", "checking", "reading", "organizing", "done"],
  },
  {
    id: "travel",
    label: "Travel",
    input: "I’m going to New York from August 16 to August 20.",
    event: { title: "New York Trip", dates: "Aug 16 – Aug 20" },
    tasks: [
      { title: "Check passport expiry", due: "Aug 11", priority: "high" },
      { title: "Confirm hotel booking", due: "Aug 13" },
      { title: "Arrange airport transfer", due: "Aug 15" },
    ],
    reminder: "Check in 24 hours before the flight",
    stages: ["understanding", "checking", "organizing", "done"],
  },
  {
    id: "purchases",
    label: "Purchases & returns",
    input: "I bought headphones today and have 30 days to return them.",
    event: { title: "Headphones Return Window", dates: "Aug 9 – Sep 8" },
    tasks: [
      { title: "Test the headphones properly", due: "Aug 16" },
      { title: "Decide whether to keep them", due: "Sep 3", priority: "high" },
    ],
    reminder: "Return window closes in 5 days",
    stages: ["understanding", "checking", "organizing", "done"],
  },
  {
    id: "documents",
    label: "Documents & renewals",
    input: "My passport expires in March and I travel a lot.",
    event: { title: "Passport Renewal", dates: "Aug 9 – Mar 1" },
    tasks: [
      { title: "Book a photo appointment", due: "Sep 5" },
      { title: "Gather supporting documents", due: "Sep 20" },
      { title: "Submit the renewal application", due: "Oct 1", priority: "high" },
    ],
    reminder: "Renew at least 6 months before expiry",
    stages: ["understanding", "checking", "reading", "organizing", "done"],
  },
  {
    id: "follow-ups",
    label: "Follow-ups",
    input: "I emailed my landlord and need to follow up next Monday.",
    event: { title: "Lease Addendum", dates: "Aug 9 – Aug 18" },
    tasks: [{ title: "Re-send the lease request", due: "Aug 11", priority: "high" }],
    waiting: { title: "Lease addendum", on: "Landlord" },
    stages: ["understanding", "checking", "organizing", "done"],
  },
  {
    id: "appointments",
    label: "Appointments",
    input: "I have a dentist appointment on the 22nd at 9am.",
    event: { title: "Dentist Appointment", dates: "Aug 22" },
    tasks: [
      { title: "Confirm the appointment time", due: "Aug 20" },
      { title: "Check insurance coverage", due: "Aug 21" },
    ],
    reminder: "Leave by 8:15am on the day",
    stages: ["understanding", "checking", "organizing", "done"],
  },
];

export const heroPlan = demoPlans[0];

/** The loose details people actually receive, before anything organizes them. */
export const looseEnds = [
  "Moving September 1",
  "Return window closes in 12 days",
  "Waiting for landlord response",
  "Passport renewal coming up",
  "Follow up next Monday",
];
