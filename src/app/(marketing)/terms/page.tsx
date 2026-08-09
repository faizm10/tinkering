import type { Metadata } from "next";

import { ProsePage, ProseSection } from "@/components/marketing/prose-page";

export const metadata: Metadata = {
  title: "Terms — Life Admin",
  description: "The terms on which Life Admin is offered.",
};

export default function TermsPage() {
  return (
    <ProsePage
      eyebrow="Terms"
      title="Terms of use."
      intro="A plain summary of what you can expect from Life Admin and what it expects from you. This is a product summary, not a legal agreement."
    >
      <ProseSection heading="The service">
        <p>
          Life Admin drafts plans from what you describe and keeps track of them once you approve
          them. It is early software and features may change.
        </p>
      </ProseSection>

      <ProseSection heading="Your account">
        <p>
          You are responsible for the security of your sign-in details and for the content you put
          into your workspace.
        </p>
      </ProseSection>

      <ProseSection heading="Agent output">
        <p>
          Plans are generated suggestions. They can be wrong about a date, miss a step, or propose
          something that does not apply to you — which is why nothing is saved until you review and
          approve it. Do not rely on Life Admin as legal, medical, immigration or financial advice.
        </p>
      </ProseSection>

      <ProseSection heading="Deadlines">
        <p>
          Life Admin helps you keep track of deadlines. It does not guarantee that you will meet
          them, and missing one remains your responsibility.
        </p>
      </ProseSection>

      <ProseSection heading="Availability">
        <p>
          The service is provided as-is, without a uptime guarantee or warranty.
        </p>
      </ProseSection>
    </ProsePage>
  );
}
