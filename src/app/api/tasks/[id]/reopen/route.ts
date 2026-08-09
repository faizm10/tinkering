import { setTaskCompleted } from "@/server/services/task-service";

export async function POST(_request: Request, context: { params: Promise<unknown> }) {
  const { id } = (await context.params) as { id: string };
  try {
    return Response.json({ task: await setTaskCompleted(id, false) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Task update failed." }, { status: 404 });
  }
}
