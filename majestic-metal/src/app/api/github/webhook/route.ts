import { hasDatabase } from "@/db";
import {
  deleteInstallation,
  resyncExistingInstallation,
} from "@/lib/github-sync";
import { verifyGitHubWebhook } from "@/lib/github";

type GitHubWebhook = {
  action?: string;
  installation?: { id: number };
};

export async function POST(request: Request) {
  const deliveryId = request.headers.get("x-github-delivery");
  const eventName = request.headers.get("x-github-event");
  const payload = await request.text();

  if (!verifyGitHubWebhook(payload, request.headers.get("x-hub-signature-256"))) {
    console.warn("github_webhook_rejected", { deliveryId, eventName });
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return Response.json({ error: "database_not_configured" }, { status: 503 });
  }

  try {
    const body = JSON.parse(payload) as GitHubWebhook;
    const installationId = body.installation?.id;

    if (eventName === "ping") return Response.json({ ok: true });
    if (!installationId) return Response.json({ ok: true, ignored: true });

    if (eventName === "installation" && body.action === "deleted") {
      await deleteInstallation(installationId);
    } else if (
      eventName === "installation_repositories" ||
      (eventName === "installation" &&
        ["created", "unsuspend", "suspend", "new_permissions_accepted"].includes(body.action ?? ""))
    ) {
      await resyncExistingInstallation(installationId);
    }

    console.info("github_webhook_processed", { deliveryId, eventName, installationId });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("github_webhook_failed", { deliveryId, eventName, error });
    return Response.json({ error: "webhook_processing_failed" }, { status: 500 });
  }
}
