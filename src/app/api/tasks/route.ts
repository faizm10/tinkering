import { z } from "zod";
import { createTask } from "@/server/services/manual-service";

export async function POST(request: Request) {
  try {
    const task = await createTask(await request.json());
    return Response.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? "Invalid task." }, { status: 400 });
    }
    return Response.json({ error: error instanceof Error ? error.message : "Could not create task." }, { status: 400 });
  }
}
