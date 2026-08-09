import "server-only";

import { getDemoDashboard, getDemoEvent, listDemoEvents, listDemoProposals } from "@/server/services/demo-store";

export async function getDashboardData() {
  return getDemoDashboard();
}

export async function getAllLifeEvents() {
  return listDemoEvents();
}

export async function getLifeEvent(eventId: string) {
  return getDemoEvent(eventId);
}

export async function getAllProposals() {
  return listDemoProposals();
}
