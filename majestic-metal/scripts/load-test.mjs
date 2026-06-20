import { randomUUID } from "node:crypto";

const endpoint = process.env.INGEST_ENDPOINT ?? "http://localhost:3000/api/ingest";
const projectKey = process.env.INGEST_PROJECT_KEY ?? "rp_pub_demo_project";
const total = Number(process.env.EVENT_COUNT ?? 1000);
const batchSize = 50;
const concurrency = Number(process.env.CONCURRENCY ?? 8);

async function sendBatch(offset) {
  const events = Array.from({ length: Math.min(batchSize, total - offset) }, (_, index) => ({
    id: randomUUID(),
    name: index % 3 === 0 ? "$pageview" : "load_test_event",
    anonymousId: `load-user-${(offset + index) % 500}`,
    sessionId: `load-session-${Math.floor((offset + index) / 5)}`,
    timestamp: new Date().toISOString(),
    path: "/load-test",
    properties: { sequence: offset + index },
  }));

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      "idempotency-key": randomUUID(),
    },
    body: JSON.stringify({ projectKey, events }),
  });
  if (!response.ok) throw new Error(`Batch ${offset} failed: ${response.status} ${await response.text()}`);
  return events.length;
}

const offsets = Array.from({ length: Math.ceil(total / batchSize) }, (_, index) => index * batchSize);
let accepted = 0;
const startedAt = performance.now();

for (let index = 0; index < offsets.length; index += concurrency) {
  const counts = await Promise.all(offsets.slice(index, index + concurrency).map(sendBatch));
  accepted += counts.reduce((sum, count) => sum + count, 0);
}

const seconds = (performance.now() - startedAt) / 1000;
console.log(JSON.stringify({ accepted, seconds: Number(seconds.toFixed(2)), eventsPerSecond: Math.round(accepted / seconds) }));
