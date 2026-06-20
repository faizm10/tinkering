import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { batchAlreadyProcessed, persistBatch, resolveProjectKey } from "@/lib/ingest";
import { ingestionBatchSchema } from "@/lib/ingestion-schema";
import { checkIngestionRateLimit } from "@/lib/rate-limit";
import { hashValue, MAX_REQUEST_BYTES } from "@/lib/tracking";

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers": "authorization, content-type, idempotency-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(
  body: Record<string, unknown>,
  status: number,
  origin: string | null,
  extraHeaders?: Record<string, string>,
) {
  return Response.json(body, {
    status,
    headers: { ...corsHeaders(origin), ...extraHeaders },
  });
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

export async function POST(request: Request) {
  const startedAt = performance.now();
  const requestId = randomUUID();
  const origin = request.headers.get("origin");

  try {
    const declaredSize = Number(request.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_REQUEST_BYTES) {
      return json({ error: "payload_too_large", requestId }, 413, origin);
    }

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BYTES) {
      return json({ error: "payload_too_large", requestId }, 413, origin);
    }

    let rawPayload: unknown;
    try {
      rawPayload = JSON.parse(rawBody);
    } catch {
      return json({ error: "invalid_json", requestId }, 400, origin);
    }

    const authorization = request.headers.get("authorization");
    const bearerKey = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
    const bodyKey =
      typeof rawPayload === "object" && rawPayload && "projectKey" in rawPayload
        ? String(rawPayload.projectKey)
        : undefined;
    const rawKey = bearerKey ?? bodyKey;
    if (!rawKey) return json({ error: "missing_project_key", requestId }, 401, origin);

    const project = await resolveProjectKey(rawKey);
    if (!project) return json({ error: "invalid_project_key", requestId }, 401, origin);

    if (
      project.keyKind === "public" &&
      origin &&
      !project.allowedOrigins.includes(origin)
    ) {
      return json({ error: "origin_not_allowed", requestId }, 403, origin);
    }

    const rateLimit = await checkIngestionRateLimit(`${project.id}:${hashValue(rawKey).slice(0, 16)}`);
    if (!rateLimit.success) {
      return json(
        { error: "rate_limited", requestId },
        429,
        origin,
        {
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.reset),
        },
      );
    }

    const payload = ingestionBatchSchema.parse(rawPayload);
    const now = Date.now();
    const rejected = payload.events
      .map((event, index) => {
        const timestamp = new Date(event.timestamp).getTime();
        if (timestamp > now + 5 * 60_000) return { index, reason: "timestamp_in_future" };
        if (timestamp < now - 7 * 86_400_000) return { index, reason: "timestamp_too_old" };
        return null;
      })
      .filter((item): item is { index: number; reason: string } => item !== null);

    const rejectedIndexes = new Set(rejected.map((item) => item.index));
    const validEvents = payload.events.filter((_, index) => !rejectedIndexes.has(index));
    const idempotencyKey = request.headers.get("idempotency-key") ?? randomUUID();

    if (await batchAlreadyProcessed(project.id, idempotencyKey)) {
      return json(
        { accepted: 0, duplicates: validEvents.length, rejected, requestId, idempotent: true },
        200,
        origin,
      );
    }

    const result = await persistBatch({
      project,
      batch: validEvents,
      idempotencyKey,
      userAgent: request.headers.get("user-agent"),
    });

    console.info("ingestion_completed", {
      requestId,
      projectId: project.id,
      accepted: result.accepted,
      duplicates: result.duplicates,
      rejected: rejected.length,
      durationMs: Math.round(performance.now() - startedAt),
    });

    return json({ ...result, rejected, requestId }, rejected.length ? 207 : 202, origin);
  } catch (error) {
    if (error instanceof ZodError) {
      return json(
        {
          error: "validation_failed",
          requestId,
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        400,
        origin,
      );
    }

    console.error("ingestion_failed", {
      requestId,
      durationMs: Math.round(performance.now() - startedAt),
      error,
    });
    return json({ error: "internal_error", requestId }, 500, origin);
  }
}
