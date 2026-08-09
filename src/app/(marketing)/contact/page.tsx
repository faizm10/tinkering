import type { Metadata } from "next";
import Link from "next/link";

import { ProsePage, ProseSection } from "@/components/marketing/prose-page";

export const metadata: Metadata = {
  title: "Contact — Life Admin",
  description: "How to reach the people building Life Admin.",
};

export default function ContactPage() {
  return (
    <ProsePage
      eyebrow="Contact"
      title="Get in touch."
      intro="Life Admin is early, and feedback from people actually using it shapes what gets built next."
    >
      <ProseSection heading="Support channel">
        {/* Placeholder: no public inbox is published for this project yet.
            Replace this section with a real address or form when one exists —
            an invented contact address would be worse than none. */}
        <p>
          A public support address is not published yet. If you are running this instance yourself,
          the fastest route is whoever deployed it.
        </p>
      </ProseSection>

      <ProseSection heading="Already have an account?">
        <p>
          Your activity history records every change Life Admin has made to your workspace, which
          is usually the quickest way to answer &ldquo;what happened to this plan?&rdquo;.
        </p>
        <p>
          <Link
            href="/login"
            className="text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-ink"
          >
            Sign in
          </Link>{" "}
          to check it.
        </p>
      </ProseSection>

      <ProseSection heading="New here?">
        <p>
          <Link
            href="/register"
            className="text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-ink"
          >
            Create an account
          </Link>{" "}
          and describe one thing you are currently keeping track of in your head.
        </p>
      </ProseSection>
    </ProsePage>
  );
}
