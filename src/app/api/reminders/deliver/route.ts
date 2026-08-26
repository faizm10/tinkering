import { deliverReminder } from "@/server/reminders/delivery-service";
import { verifyReminderWorkerRequest } from "@/server/reminders/auth";
import { reminderDeliveryPayloadSchema } from "@/server/reminders/types";

export async function POST(request: Request) {
  const body = await request.text();

  try {
    await verifyReminderWorkerRequest(request, body);
    const payload = reminderDeliveryPayloadSchema.parse(JSON.parse(body));
    const result = await deliverReminder(payload);

    return Response.json(
      { result },
      { status: result.status === "retry" ? 500 : 200 },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Reminder delivery failed." },
      { status: 401 },
    );
  }
}
