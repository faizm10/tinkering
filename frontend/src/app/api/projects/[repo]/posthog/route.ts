import { z } from "zod";
import {
  connectPosthog,
  disconnectPosthog,
  getPosthogConnection,
} from "@/lib/posthog-admin";
import { getRouteUserId } from "@/lib/project-admin";

const connectSchema = z.object({
  host: z.string().url().default("https://us.posthog.com"),
  posthogProjectId: z.string().min(1),
  personalApiKey: z.string().min(10),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ repo: string }> },
) {
  const userId = await getRouteUserId();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { repo } = await params;
  const connection = await getPosthogConnection(userId, repo);
  return Response.json({ connection });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ repo: string }> },
) {
  const userId = await getRouteUserId();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { repo } = await params;
  try {
    const payload = connectSchema.parse(await request.json());
    const connection = await connectPosthog({ clerkUserId: userId, repositorySlug: repo, ...payload });
    return Response.json({ connection }, { status: 201 });
  } catch (error) {
    console.error("posthog_connection_failed", { repo, error });
    const message = error instanceof Error ? error.message : "connection_failed";
    return Response.json({ error: message }, { status: 400 });
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
    await disconnectPosthog(userId, repo);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("posthog_disconnect_failed", { repo, error });
    return Response.json({ error: "disconnect_failed" }, { status: 400 });
  }
}
