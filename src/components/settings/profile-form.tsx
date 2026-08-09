"use client";

import { useActionState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";

import { updateProfile, type ProfileFormState } from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { duration, easing } from "@/lib/motion";
import type { DashboardData } from "@/server/services/types";

const reminderOptions = ["Morning digest", "Evening digest", "Only on the day"];

/** Saving confirms inline next to the button — no toast for a one-field save. */
export function ProfileForm({
  profile,
  submitLabel = "Save preferences",
}: {
  profile: DashboardData["profile"];
  submitLabel?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, {
    status: "idle",
  });

  const error = state.status === "error" ? state.message : undefined;

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="profile-name" hint="Used in your daily greeting.">
          <Input
            id="profile-name"
            name="name"
            defaultValue={profile.name}
            required
            maxLength={80}
          />
        </Field>
        <Field label="Timezone" htmlFor="profile-timezone" hint="Deadlines are read in this zone.">
          <Input
            id="profile-timezone"
            name="timezone"
            defaultValue={profile.timezone}
            required
            maxLength={60}
          />
        </Field>
        <Field label="Reminders" htmlFor="profile-reminder" className="sm:col-span-2">
          <Select
            id="profile-reminder"
            name="reminderPreference"
            defaultValue={profile.reminderPreference}
          >
            {reminderOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error ? (
        <p role="alert" className="text-[0.875rem] text-error">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <AnimatePresence>
          {state.status === "saved" && !pending ? (
            <motion.span
              initial={reduceMotion ? false : { opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.control, ease: easing.out }}
              className="inline-flex items-center gap-1.5 text-[0.8125rem] text-success"
              role="status"
            >
              <Check className="size-3.5" />
              Saved
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </form>
  );
}
