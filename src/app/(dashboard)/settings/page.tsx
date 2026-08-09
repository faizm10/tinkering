import { Section } from "@/components/life-admin/section";
import { getDashboardData } from "@/server/services/life-admin";

export default async function SettingsPage() {
  const data = await getDashboardData();
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <Section title="Profile and reminders">
        <div className="grid gap-4 md:grid-cols-3">
          <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{data.profile.name}</p></div>
          <div><p className="text-sm text-muted-foreground">Timezone</p><p className="font-medium">{data.profile.timezone}</p></div>
          <div><p className="text-sm text-muted-foreground">Reminder preference</p><p className="font-medium">{data.profile.reminderPreference}</p></div>
        </div>
      </Section>
      <Section title="Privacy">
        <p className="text-sm text-muted-foreground">Life Admin does not store credentials, government ID numbers, or banking details. External writes are intentionally out of scope for this MVP.</p>
      </Section>
    </div>
  );
}
