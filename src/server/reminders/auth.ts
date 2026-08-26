import "server-only";

import { Receiver } from "@upstash/qstash";

import { env, hasQstashSigningKeys, requireCronSecret } from "@/lib/env";

export async function verifyReminderWorkerRequest(request: Request, body: string) {
  const authorization = request.headers.get("authorization");

  if (authorization && env.CRON_SECRET) {
    requireCronSecret(authorization);
    return;
  }

  if (!hasQstashSigningKeys()) {
    requireCronSecret(authorization);
    return;
  }

  const signature = request.headers.get("upstash-signature");
  if (!signature) {
    throw new Error("Missing QStash signature.");
  }

  const receiver = new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });

  await receiver.verify({
    signature,
    body,
    url: request.url,
    upstashRegion: request.headers.get("upstash-region") ?? undefined,
    clockTolerance: 30,
  });
}
