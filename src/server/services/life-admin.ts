import "server-only";

import {
  getDemoDashboard,
  getDemoEvent,
  listDemoEvents,
  listDemoProposals,
  listDemoTasks,
  listDemoWaiting,
  updateDemoProfile,
} from "@/server/services/demo-store";
import type { DashboardData } from "@/server/services/types";

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

export async function getAllTasks() {
  return listDemoTasks();
}

export async function getAllWaitingItems() {
  return listDemoWaiting();
}

export async function saveProfile(profile: DashboardData["profile"]) {
  return updateDemoProfile(profile);
}
