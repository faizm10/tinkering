import type { DashboardData } from "@/server/services/types";
import { isDueToday, isOverdue } from "@/lib/dates";

export function buildDailyBrief(data: DashboardData) {
  const overdue = [...data.today, ...data.upcoming].filter((task) => isOverdue(task.dueDate));
  const dueToday = data.today.filter((task) => isDueToday(task.dueDate));
  const followUps = data.waiting.filter((item) => isDueToday(item.followUpDate) || isOverdue(item.followUpDate));
  const soon = data.upcoming.slice(0, 3);

  if (overdue.length === 0 && dueToday.length === 0 && followUps.length === 0 && soon.length === 0) {
    return "You have no urgent personal admin today. Keep an eye on upcoming events as dates get closer.";
  }

  const parts: string[] = [];
  if (dueToday.length) {
    parts.push(`Today you need to ${dueToday.map((task) => task.title.toLowerCase()).join(" and ")}.`);
  }
  if (overdue.length) {
    parts.push(`${overdue.length} item${overdue.length === 1 ? " is" : "s are"} overdue.`);
  }
  if (followUps.length) {
    parts.push(`Follow up on ${followUps.map((item) => item.title.toLowerCase()).join(" and ")}.`);
  }
  if (soon.length) {
    parts.push(`${soon[0].title} is coming up soon.`);
  }

  return parts.join(" ");
}
