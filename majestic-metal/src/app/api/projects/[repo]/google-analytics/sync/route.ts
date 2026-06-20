import { getGoogleAnalyticsConnection } from "@/lib/google-analytics-admin";
import { syncGoogleAnalyticsConnection } from "@/lib/google-analytics";
import { getRouteUserId } from "@/lib/project-admin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ repo: string }> },
) {
  const userId = await getRouteUserId();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { repo } = await params;

  try {
    const connection = await getGoogleAnalyticsConnection(userId, repo);
    if (!connection) return Response.json({ error: "not_connected" }, { status: 404 });
    const result =
      connection.id === "demo-google-analytics"
        ? { recordsProcessed: 30 }
        : await syncGoogleAnalyticsConnection(connection.id);
    return Response.json(result);
  } catch (error) {
    console.error("google_analytics_manual_sync_failed", { repo, error });
    return Response.json({ error: "sync_failed" }, { status: 400 });
  }
}
