import { Section } from "@/components/life-admin/section";
import { TaskRow } from "@/components/dashboard/task-row";
import { getDashboardData } from "@/server/services/life-admin";

export default async function TasksPage() {
  const data = await getDashboardData();
  const tasks = [...data.today, ...data.upcoming, ...data.recentlyCompleted];
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="text-3xl font-semibold">Tasks</h1>
      <Section title="All tasks" description="Filter controls are ready to extend; this MVP keeps the full list visible.">
        {tasks.map((task) => <TaskRow key={task.id} task={task} />)}
      </Section>
    </div>
  );
}
