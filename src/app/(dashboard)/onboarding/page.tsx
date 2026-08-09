import { Section } from "@/components/life-admin/section";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-3xl font-semibold">Set up Life Admin</h1>
      <Section title="Preferences">
        <form className="space-y-4">
          <label className="block text-sm font-medium">Name<input name="name" className="mt-2 w-full border border-input bg-background p-3" defaultValue="Faiz" /></label>
          <label className="block text-sm font-medium">Timezone<input name="timezone" className="mt-2 w-full border border-input bg-background p-3" defaultValue="America/Toronto" /></label>
          <label className="block text-sm font-medium">Default reminder preference<input name="reminder" className="mt-2 w-full border border-input bg-background p-3" defaultValue="Morning digest" /></label>
          <Button type="submit">Save preferences</Button>
        </form>
      </Section>
    </div>
  );
}
