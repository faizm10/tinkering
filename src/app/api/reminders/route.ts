import { z } from "zod";
import { createReminder } from "@/server/services/manual-service";

export async function POST(request: Request) {
  try {
    const reminder = await createReminder(await request.json());
    return Response.json({ reminder }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? "Invalid reminder." }, { status: 400 });
    }
    return Response.json({ error: error instanceof Error ? error.message : "Could not create reminder." }, { status: 400 });
  }
}
