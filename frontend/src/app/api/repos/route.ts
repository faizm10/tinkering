import { getRouteUserId, listUserRepositories } from "@/lib/project-admin";

export async function GET() {
  const userId = await getRouteUserId();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const repos = await listUserRepositories(userId);
  return Response.json({ repos });
}
