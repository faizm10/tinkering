"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { saveProfile } from "@/server/services/sonae";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Add the name Sonae should greet you by.").max(80),
  timezone: z.string().trim().min(1, "Add a timezone so dates line up.").max(60),
  reminderPreference: z.string().trim().min(1, "Choose when reminders should arrive.").max(60),
  notificationEmail: z.preprocess(
    (value) => value ?? "",
    z.string().trim().email("Add a valid notification email.").max(160).optional().or(z.literal("")),
  ),
});

export type ProfileFormState = { status: "idle" | "saved" | "error"; message?: string };

export async function updateProfile(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  await requireUser();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    timezone: formData.get("timezone"),
    reminderPreference: formData.get("reminderPreference"),
    notificationEmail: formData.get("notificationEmail"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check these details." };
  }

  await saveProfile({
    ...parsed.data,
    notificationEmail: parsed.data.notificationEmail || null,
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { status: "saved" };
}
