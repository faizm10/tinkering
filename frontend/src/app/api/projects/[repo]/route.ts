import { z } from "zod";
import {
  deleteProjectData,
  getRouteUserId,
  updateProjectOrigins,
} from "@/lib/project-admin";

const originsSchema = z.object({
  allowedOrigins: z
    .array(z.url())
    .min(1)
    .max(20)
    .transform((origins) => origins.map((origin) => new URL(origin).origin)),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ repo: string }> },
) {
  const userId = await getRouteUserId();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { repo } = await params;

  try {
    const { allowedOrigins } = originsSchema.parse(await request.json());
    await updateProjectOrigins({ clerkUserId: userId, repositorySlug: repo, allowedOrigins });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("project_origins_update_failed", { repo, error });
    return Response.json({ error: "update_failed" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ repo: string }> },
) {
  const userId = await getRouteUserId();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { repo } = await params;

  try {
    await deleteProjectData(userId, repo);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("project_deletion_failed", { repo, error });
    return Response.json({ error: "delete_failed" }, { status: 400 });
  }
}
