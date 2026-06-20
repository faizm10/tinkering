import { Check, Github, KeyRound, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingForm } from "@/components/onboarding-form";

const steps = [
  { label: "Install GitHub App", icon: Github, complete: true },
  { label: "Select repository", icon: Check, complete: true },
  { label: "Configure tracking", icon: KeyRound, complete: false },
  { label: "Verify first event", icon: Radio, complete: false },
];

export default function OnboardingPage() {
  const installUrl = process.env.GITHUB_APP_SLUG
    ? "/api/github/install"
    : "https://github.com/settings/apps/new";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Badge variant="outline">Onboarding</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Connect a repository</h1>
        <p className="mt-2 text-muted-foreground">
          GitHub controls which repositories RepoPulse can discover. Product data remains isolated per repository.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className="relative rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <step.icon className={step.complete ? "size-4 text-primary" : "size-4 text-muted-foreground"} />
              <span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
            </div>
            <p className="mt-5 text-sm font-medium">{step.label}</p>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>1. Install the GitHub App</CardTitle>
          <CardDescription>
            Grant read-only Metadata access to selected personal or organization repositories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href={installUrl} target="_blank" rel="noreferrer">
              <Github className="size-4" />
              Install on GitHub
            </a>
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>2. Configure the product origin</CardTitle>
          <CardDescription>
            The repository selection will appear here after the installation callback synchronizes it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
}
