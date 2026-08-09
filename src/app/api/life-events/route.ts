import { z } from "zod";
import { createLifeEvent } from "@/server/services/manual-service";

export async function POST(request: Request) {
  try {
    const eventId = await createLifeEvent(await request.json());
    return Response.json({ eventId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? "Invalid life event." }, { status: 400 });
    }
    return Response.json({ error: error instanceof Error ? error.message : "Could not create life event." }, { status: 400 });
  }
}
