import "server-only";

import { requireUser } from "@/lib/auth/session";
import { getDataRepository } from "@/server/providers";
import type { DashboardData } from "@/server/services/types";

export async function getDashboardData() {
  const user = await requireUser();
  return getDataRepository().getDashboardData(user.id);
}

export async function getAllLifeEvents() {
  const user = await requireUser();
  return getDataRepository().listLifeEvents(user.id);
}

export async function getLifeEvent(eventId: string) {
  const user = await requireUser();
  return getDataRepository().getLifeEvent(user.id, eventId);
}

export async function getAllProposals() {
  const user = await requireUser();
  return getDataRepository().listProposals(user.id);
}

export async function getProposal(proposalId: string) {
  const user = await requireUser();
  return getDataRepository().getProposal(user.id, proposalId);
}

export async function getAllTasks() {
  const user = await requireUser();
  return getDataRepository().listTasks(user.id);
}

export async function getAllWaitingItems() {
  const user = await requireUser();
  return getDataRepository().listWaitingItems(user.id);
}

export async function saveProfile(profile: DashboardData["profile"]) {
  const user = await requireUser();
  return getDataRepository().updateProfile(user.id, profile);
}
