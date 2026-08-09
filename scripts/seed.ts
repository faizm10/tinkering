import { getDemoDashboard } from "@/server/services/demo-store";

const data = getDemoDashboard();

console.log("Development seed data prepared:");
console.log(`- ${data.lifeEvents.length} active life events`);
console.log(`- ${data.today.length + data.upcoming.length + data.recentlyCompleted.length} tasks`);
console.log(`- ${data.waiting.length} waiting items`);
