import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createAgentProposal } from "@/server/agent/agent";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in before creating a proposal." }, { status: 401 });

  try {
    const result = await createAgentProposal(user.id, await request.json());
    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    return Response.json({ error: error instanceof Error ? error.message : "The agent failed." }, { status: 500 });
  }
}
