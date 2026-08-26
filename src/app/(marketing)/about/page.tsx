import type { Metadata } from "next";
import Link from "next/link";

import { ProsePage, ProseSection } from "@/components/marketing/prose-page";

export const metadata: Metadata = {
  title: "About — Sonae",
  description: "Why Sonae exists and what it is built to do.",
};

export default function AboutPage() {
  return (
    <ProsePage
      eyebrow="About"
      title="Personal operations deserve a system."
      intro="Work has project tools, trackers and calendars. The admin around your life — the move, the return window, the renewal, the reply you are still waiting on — has none of that. Sonae is built for that half."
    >
      <ProseSection heading="What it is">
        <p>
          Sonae is a personal operations system with an agent at the front of it. You describe
          a situation in a sentence. The agent works out the life event behind it, the tasks it
          implies, the dates those tasks fall on, and anything that depends on someone else
          replying.
        </p>
        <p>
          It then stops and shows you the plan. Nothing is saved until you approve it.
        </p>
      </ProseSection>

      <ProseSection heading="What it is not">
        <p>
          It is not a chatbot, and it is not another blank to-do list. There is no conversation to
          maintain and nothing to set up before it is useful. It also does not act for you: it will
          not contact third parties, buy anything, cancel a service or delete a record.
        </p>
      </ProseSection>

      <ProseSection heading="Where it is">
        <p>
          Sonae is early. The agent, the approval flow, deadline tracking, reminder notifications
          and the waiting-on record all work today. External integrations and shared household
          events are not built yet.
        </p>
        <p>
          <Link
            href="/register"
            className="text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-ink"
          >
            Create an account
          </Link>{" "}
          to try it, or{" "}
          <Link
            href="/contact"
            className="text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-ink"
          >
            get in touch
          </Link>
          .
        </p>
      </ProseSection>
    </ProsePage>
  );
}
