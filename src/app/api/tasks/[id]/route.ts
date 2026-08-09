import { updateTask } from "@/server/services/manual-service";

export async function PATCH(request: Request, context: { params: Promise<unknown> }) {
  try {
    const { id } = (await context.params) as { id: string };
    return Response.json({ task: await updateTask(id, await request.json()) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not update task." }, { status: 400 });
  }
}
