import { PageHeader } from "@/components/life-admin/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { getDashboardData } from "@/server/services/life-admin";

export default async function SettingsPage() {
  const data = await getDashboardData();

  return (
    <div className="max-w-2xl space-y-9">
      <PageHeader title="Settings" description="How Life Admin greets you and when it reminds you." />

      <section>
        <h2 className="type-section border-b border-hairline pb-2.5">Profile</h2>
        <div className="pt-5">
          <ProfileForm profile={data.profile} />
        </div>
      </section>

      <section>
        <h2 className="type-section border-b border-hairline pb-2.5">Privacy</h2>
        <div className="space-y-3 pt-4">
          <p className="type-body text-body">
            Life Admin does not store credentials, government ID numbers, or banking details, and it
            never contacts a company on your behalf.
          </p>
          <p className="type-body text-body">
            The agent only drafts plans. Every plan waits for your approval before anything is
            saved.
          </p>
        </div>
      </section>
    </div>
  );
}
