import { z } from "zod";
import { createAnalyticsProject, getRouteUserId } from "@/lib/project-admin";

const createProjectSchema = z.object({
  repositoryFullName: z.string().min(3).max(512),
  allowedOrigins: z
    .array(z.url())
    .min(1)
    .max(20)
    .transform((origins) => origins.map((origin) => new URL(origin).origin)),
});

export async function POST(request: Request) {
  const userId = await getRouteUserId();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  try {
    const payload = createProjectSchema.parse(await request.json());
    const result = await createAnalyticsProject({ clerkUserId: userId, ...payload });
    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error("project_creation_failed", { error });
    const message = error instanceof Error ? error.message : "project_creation_failed";
    return Response.json({ error: message }, { status: message === "repository_not_found" ? 404 : 400 });
  }
}
