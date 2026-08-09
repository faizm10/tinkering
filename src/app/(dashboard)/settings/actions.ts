"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { saveProfile } from "@/server/services/life-admin";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Add the name Life Admin should greet you by.").max(80),
  timezone: z.string().trim().min(1, "Add a timezone so dates line up.").max(60),
  reminderPreference: z.string().trim().min(1, "Choose when reminders should arrive.").max(60),
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
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check these details." };
  }

  await saveProfile(parsed.data);
  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { status: "saved" };
}
