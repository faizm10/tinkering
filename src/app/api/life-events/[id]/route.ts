import { completeLifeEvent, updateLifeEvent } from "@/server/services/manual-service";

export async function PATCH(request: Request, context: { params: Promise<unknown> }) {
  try {
    const { id } = (await context.params) as { id: string };
    return Response.json({ event: await updateLifeEvent(id, await request.json()) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not update life event." }, { status: 400 });
  }
}

export async function POST(_request: Request, context: { params: Promise<unknown> }) {
  try {
    const { id } = (await context.params) as { id: string };
    await completeLifeEvent(id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not complete life event." }, { status: 400 });
  }
}
