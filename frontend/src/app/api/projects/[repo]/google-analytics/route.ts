import { z } from "zod";
import {
  connectGoogleAnalytics,
  disconnectGoogleAnalytics,
  getGoogleAnalyticsConnection,
} from "@/lib/google-analytics-admin";
import { getRouteUserId } from "@/lib/project-admin";

const serviceAccountSchema = z.object({
  client_email: z.email(),
  private_key: z.string().min(100),
  project_id: z.string().optional(),
});

const connectSchema = z.object({
  propertyId: z.string().regex(/^(properties\/)?\d+$/, "Enter a numeric GA4 property ID"),
  propertyName: z.string().max(255).optional(),
  serviceAccount: z.union([serviceAccountSchema, z.string().min(20)]),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ repo: string }> },
) {
  const userId = await getRouteUserId();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { repo } = await params;
  const connection = await getGoogleAnalyticsConnection(userId, repo);
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
    const credentials =
      typeof payload.serviceAccount === "string"
        ? serviceAccountSchema.parse(JSON.parse(payload.serviceAccount))
        : payload.serviceAccount;
    const connection = await connectGoogleAnalytics({
      clerkUserId: userId,
      repositorySlug: repo,
      propertyId: payload.propertyId,
      propertyName: payload.propertyName,
      credentials,
    });
    return Response.json({ connection }, { status: 201 });
  } catch (error) {
    console.error("google_analytics_connection_failed", { repo, error });
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
    await disconnectGoogleAnalytics(userId, repo);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("google_analytics_disconnect_failed", { repo, error });
    return Response.json({ error: "disconnect_failed" }, { status: 400 });
  }
}
