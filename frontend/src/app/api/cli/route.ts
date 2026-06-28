import { z } from "zod";
import { getCliProjectByPublicKey, recordSdkInstall } from "@/lib/project-admin";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const INGEST_ENDPOINT =
  (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") + "/api/ingest";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// Verify a project key and return linkage info so the agent can confirm the project.
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key")?.trim() ?? "";
  if (!key.startsWith("rp_pub_")) {
    return Response.json(
      { valid: false, error: "Provide your public project key (starts with rp_pub_)." },
      { status: 400, headers: CORS },
    );
  }

  const project = await getCliProjectByPublicKey(key);
  if (!project) {
    return Response.json({ valid: false, error: "Key not recognized." }, { status: 404, headers: CORS });
  }

  return Response.json(
    {
      valid: true,
      repository: project.repository,
      slug: project.slug,
      ingestEndpoint: INGEST_ENDPOINT,
      allowedOrigins: project.allowedOrigins,
      alreadyInstalled: Boolean(project.sdkInstalledAt),
    },
    { headers: CORS },
  );
}

const reportSchema = z.object({
  projectKey: z.string().startsWith("rp_pub_"),
  framework: z.string().max(64).optional(),
  appUrl: z.string().max(2048).optional(),
});

// Report back that the SDK was installed in a project.
export async function POST(request: Request) {
  let payload: z.infer<typeof reportSchema>;
  try {
    payload = reportSchema.parse(await request.json());
  } catch {
    return Response.json({ ok: false, error: "invalid_payload" }, { status: 400, headers: CORS });
  }

  const project = await recordSdkInstall(payload.projectKey, {
    framework: payload.framework,
    appUrl: payload.appUrl,
  });
  if (!project) {
    return Response.json({ ok: false, error: "Key not recognized." }, { status: 404, headers: CORS });
  }

  console.info("cli_sdk_install_reported", {
    slug: project.slug,
    framework: payload.framework ?? null,
  });

  return Response.json(
    { ok: true, repository: project.repository, slug: project.slug },
    { headers: CORS },
  );
}
