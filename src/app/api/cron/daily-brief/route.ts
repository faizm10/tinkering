import { requireCronSecret } from "@/lib/env";
import { buildDailyBrief } from "@/server/daily-brief/brief";
import { getDashboardData } from "@/server/services/life-admin";

export async function GET(request: Request) {
  try {
    requireCronSecret(request.headers.get("authorization"));
    const data = await getDashboardData();
    return Response.json({ summary: buildDailyBrief(data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Cron request failed." }, { status: 401 });
  }
}
