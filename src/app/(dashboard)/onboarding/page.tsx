import Link from "next/link";

import { PageHeader } from "@/components/life-admin/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/server/services/life-admin";

export default async function OnboardingPage() {
  const data = await getDashboardData();

  return (
    <div className="max-w-2xl space-y-9">
      <PageHeader
        eyebrow="Step 1 of 1"
        title="Set up Life Admin"
        description="Two details now, and every plan the agent drafts will land on the right dates."
      />

      <section>
        <h2 className="type-section border-b border-hairline pb-2.5">Preferences</h2>
        <div className="pt-5">
          <ProfileForm profile={data.profile} submitLabel="Save and continue" />
        </div>
      </section>

      <div className="border-t border-hairline pt-5">
        <p className="type-meta">You can change any of this later in Settings.</p>
        <Button asChild variant="ghost" size="sm" className="mt-2 -ml-3">
          <Link href="/dashboard">Skip to the dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
