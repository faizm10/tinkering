import "server-only";

import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getDataRepository } from "@/server/providers";

export const createLifeEventSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(700).default(""),
  category: z.string().trim().min(2).max(40).default("general"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export const updateLifeEventSchema = createLifeEventSchema.partial();

export const createTaskSchema = z.object({
  lifeEventId: z.string().nullable().optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const createWaitingItemSchema = z.object({
  lifeEventId: z.string().nullable().optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  waitingOn: z.string().trim().min(2).max(120),
  expectedBy: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export const createReminderSchema = z.object({
  taskId: z.string().nullable().optional(),
  lifeEventId: z.string().nullable().optional(),
  title: z.string().trim().min(2).max(120),
  remindAt: z.string().datetime({ offset: true }),
});

export async function createLifeEvent(input: unknown) {
  const user = await requireUser();
  const parsed = createLifeEventSchema.parse(input);
  return getDataRepository().createLifeEvent(user.id, {
    ...parsed,
    startDate: parsed.startDate ?? null,
    endDate: parsed.endDate ?? null,
  });
}

export async function updateLifeEvent(eventId: string, input: unknown) {
  const user = await requireUser();
  const parsed = updateLifeEventSchema.parse(input);
  return getDataRepository().updateLifeEvent(user.id, eventId, {
    ...parsed,
    startDate: "startDate" in parsed ? (parsed.startDate ?? null) : undefined,
    endDate: "endDate" in parsed ? (parsed.endDate ?? null) : undefined,
  });
}

export async function completeLifeEvent(eventId: string) {
  const user = await requireUser();
  await getDataRepository().completeLifeEvent(user.id, eventId);
}

export async function deleteLifeEvent(eventId: string) {
  const user = await requireUser();
  await getDataRepository().deleteLifeEvent(user.id, eventId);
}

export async function createTask(input: unknown) {
  const user = await requireUser();
  const parsed = createTaskSchema.parse(input);
  return getDataRepository().createTask(user.id, {
    ...parsed,
    lifeEventId: parsed.lifeEventId ?? null,
    dueDate: parsed.dueDate ?? null,
  });
}

export async function updateTask(taskId: string, input: unknown) {
  const user = await requireUser();
  const parsed = updateTaskSchema.parse(input);
  return getDataRepository().updateTask(user.id, taskId, {
    ...parsed,
    lifeEventId: parsed.lifeEventId ?? undefined,
    dueDate: parsed.dueDate ?? undefined,
  });
}

export async function createWaitingItem(input: unknown) {
  const user = await requireUser();
  const parsed = createWaitingItemSchema.parse(input);
  return getDataRepository().createWaitingItem(user.id, {
    ...parsed,
    lifeEventId: parsed.lifeEventId ?? null,
    expectedBy: parsed.expectedBy ?? null,
    followUpDate: parsed.followUpDate ?? null,
  });
}

export async function createReminder(input: unknown) {
  const user = await requireUser();
  const parsed = createReminderSchema.parse(input);
  return getDataRepository().createReminder(user.id, {
    ...parsed,
    taskId: parsed.taskId ?? null,
    lifeEventId: parsed.lifeEventId ?? null,
  });
}
