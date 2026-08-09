import { z } from "zod";
import { createWaitingItem } from "@/server/services/manual-service";

export async function POST(request: Request) {
  try {
    const waitingItem = await createWaitingItem(await request.json());
    return Response.json({ waitingItem }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? "Invalid waiting item." }, { status: 400 });
    }
    return Response.json({ error: error instanceof Error ? error.message : "Could not create waiting item." }, { status: 400 });
  }
}
