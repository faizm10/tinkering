import { getCurrentUser } from "@/lib/auth/session";
import { resolveWaitingItem } from "@/server/services/waiting-service";

export async function POST(_request: Request, context: { params: Promise<unknown> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to resolve waiting items." }, { status: 401 });

  const { id } = (await context.params) as { id: string };
  try {
    return Response.json({ waitingItem: await resolveWaitingItem(id) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not resolve this item." },
      { status: 404 },
    );
  }
}
