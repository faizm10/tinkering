import { deleteReminder, updateReminder } from "@/server/services/manual-service";

export async function PATCH(request: Request, context: { params: Promise<unknown> }) {
  try {
    const { id } = (await context.params) as { id: string };
    return Response.json({ reminder: await updateReminder(id, await request.json()) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not update reminder." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<unknown> }) {
  try {
    const { id } = (await context.params) as { id: string };
    await deleteReminder(id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not delete reminder." }, { status: 400 });
  }
}
