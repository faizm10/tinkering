import { PageHeader } from "@/components/sonae/page-header";
import { Section } from "@/components/sonae/section";
import { EmptyState } from "@/components/sonae/states";
import { TaskGroup } from "@/components/tasks/task-group";
import { isOverdue, todayISO } from "@/lib/dates";
import { getAllLifeEvents, getAllTasks } from "@/server/services/sonae";

export default async function TasksPage() {
  const [tasks, events] = await Promise.all([getAllTasks(), getAllLifeEvents()]);
  const today = todayISO();

  const open = tasks.filter((task) => task.status !== "completed");
  const overdue = open.filter((task) => isOverdue(task.dueDate));
  const dueToday = open.filter((task) => task.dueDate === today);
  const later = open.filter(
    (task) => !overdue.includes(task) && !dueToday.includes(task),
  );
  const completed = tasks.filter((task) => task.status === "completed");

  return (
    <div className="space-y-9">
      <PageHeader
        title="Tasks"
        description={
          open.length
            ? `${open.length} open ${open.length === 1 ? "task" : "tasks"} across your life events.`
            : "Everything on your list is done."
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          message="No tasks yet."
          hint="Describe a situation and Sonae will propose the tasks behind it."
          action={{ label: "Open the composer", href: "/dashboard" }}
        />
      ) : (
        <div className="space-y-10">
          {overdue.length ? (
            <Section title="Overdue" count={overdue.length}>
              <TaskGroup tasks={overdue} events={events} />
            </Section>
          ) : null}

          <Section title="Today" count={dueToday.length}>
            {dueToday.length ? (
              <TaskGroup tasks={dueToday} events={events} />
            ) : (
              <EmptyState message="You’re clear for today." />
            )}
          </Section>

          <Section title="Later" count={later.length}>
            {later.length ? (
              <TaskGroup tasks={later} events={events} />
            ) : (
              <EmptyState message="Nothing scheduled beyond today." />
            )}
          </Section>

          {completed.length ? (
            <Section title="Completed" count={completed.length}>
              <TaskGroup tasks={completed} events={events} />
            </Section>
          ) : null}
        </div>
      )}
    </div>
  );
}
