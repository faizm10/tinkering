import type { Metadata } from "next";

import { ProsePage, ProseSection } from "@/components/marketing/prose-page";

export const metadata: Metadata = {
  title: "Privacy — Life Admin",
  description: "What Life Admin stores, what it sends to a model, and what it refuses to hold.",
};

export default function PrivacyPage() {
  return (
    <ProsePage
      eyebrow="Privacy"
      title="What Life Admin stores."
      intro="A plain description of how your data is handled. This is a summary of current product behaviour, not a legal privacy notice."
    >
      <ProseSection heading="What is stored">
        <p>
          Your account details, the situations you describe, and the life events, tasks, reminders
          and waiting items created from them. Each record is scoped to your user account.
        </p>
      </ProseSection>

      <ProseSection heading="What is sent to a language model">
        <p>
          The text of the situation you describe is sent to the configured model provider so it can
          draft a plan. Nothing else from your workspace is included in that request.
        </p>
      </ProseSection>

      <ProseSection heading="What Life Admin will not hold">
        <p>
          Life Admin does not ask for and does not store passwords to other services, government
          identification numbers, or banking and card details. If a situation you describe contains
          one, remove it before saving the plan.
        </p>
      </ProseSection>

      <ProseSection heading="What Life Admin will not do">
        <p>
          It does not send email on your behalf, make purchases, cancel services, or share your
          plans with anyone else. There is no shared or household workspace today — every workspace
          has exactly one user.
        </p>
      </ProseSection>

      <ProseSection heading="Deleting your data">
        <p>
          Removing your account removes the life events, tasks, reminders, waiting items and
          activity records attached to it.
        </p>
      </ProseSection>
    </ProsePage>
  );
}
