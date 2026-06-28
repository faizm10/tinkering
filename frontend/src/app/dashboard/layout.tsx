import { AppShell } from "@/components/app-shell";
import { requireViewer } from "@/lib/auth";
import { listUserRepositories } from "@/lib/project-admin";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  const repositories = await listUserRepositories(viewer.id);
  const projects = repositories
    .filter((repository) => repository.selected)
    .map((repository) => ({ slug: repository.name, fullName: repository.fullName }));

  return <AppShell projects={projects}>{children}</AppShell>;
}
