import { completeDemoTask } from "@/server/services/demo-store";

export async function POST(_request: Request, context: { params: Promise<unknown> }) {
  const { id } = (await context.params) as { id: string };
  try {
    return Response.json({ task: completeDemoTask(id, false) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Task update failed." }, { status: 404 });
  }
}
