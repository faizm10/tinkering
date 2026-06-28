import { AppShell } from "@/components/app-shell";
import { requireViewer } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireViewer();
  return <AppShell>{children}</AppShell>;
}
