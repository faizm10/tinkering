import { requireCronSecret } from "@/lib/env";
import { deliverDueReminders } from "@/server/reminders/delivery-service";
import { queueUpcomingReminders } from "@/server/reminders/scheduler";

export async function GET(request: Request) {
  try {
    requireCronSecret(request.headers.get("authorization"));
    const queued = await queueUpcomingReminders();
    const delivered = await deliverDueReminders();

    return Response.json({
      queued,
      delivered,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Reminder cron failed." },
      { status: 401 },
    );
  }
}
