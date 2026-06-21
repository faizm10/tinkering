import { z } from "zod";
import {
  connectVercelAnalytics,
  disconnectVercelAnalytics,
  getVercelAnalyticsConnection,
} from "@/lib/vercel-analytics-admin";
import { getRouteUserId } from "@/lib/project-admin";

const connectSchema = z.object({
  vercelProjectId: z.string().min(1),
  vercelTeamId: z.string().optional(),
  token: z.string().min(10),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ repo: string }> },
) {
  const userId = await getRouteUserId();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { repo } = await params;
  const connection = await getVercelAnalyticsConnection(userId, repo);
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
    const connection = await connectVercelAnalytics({ clerkUserId: userId, repositorySlug: repo, ...payload });
    return Response.json({ connection }, { status: 201 });
  } catch (error) {
    console.error("vercel_analytics_connection_failed", { repo, error });
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
    await disconnectVercelAnalytics(userId, repo);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("vercel_analytics_disconnect_failed", { repo, error });
    return Response.json({ error: "disconnect_failed" }, { status: 400 });
  }
}
