import { z } from "zod";
import { getRouteUserId, rotateProjectKey } from "@/lib/project-admin";

const rotateSchema = z.object({ kind: z.enum(["public", "secret"]) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ repo: string }> },
) {
  const userId = await getRouteUserId();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { repo } = await params;

  try {
    const { kind } = rotateSchema.parse(await request.json());
    const key = await rotateProjectKey({ clerkUserId: userId, repositorySlug: repo, kind });
    return Response.json({ key });
  } catch (error) {
    console.error("tracking_key_rotation_failed", { repo, error });
    return Response.json({ error: "rotation_failed" }, { status: 400 });
  }
}
