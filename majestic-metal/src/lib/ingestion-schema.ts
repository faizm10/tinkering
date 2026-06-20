import { z } from "zod";
import { MAX_BATCH_EVENTS, MAX_PROPERTIES_BYTES } from "./tracking";

const propertiesSchema = z
  .record(z.string(), z.unknown())
  .default({})
  .refine(
    (value) => Buffer.byteLength(JSON.stringify(value), "utf8") <= MAX_PROPERTIES_BYTES,
    "properties exceed 16 KB",
  );

export const ingestionEventSchema = z.object({
  id: z.string().min(8).max(128),
  name: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-zA-Z0-9_$.-]+$/, "invalid event name"),
  anonymousId: z.string().min(8).max(128),
  sessionId: z.string().min(8).max(128),
  timestamp: z.iso.datetime(),
  userId: z.string().min(1).max(255).optional(),
  traits: z.record(z.string(), z.unknown()).optional(),
  path: z.string().max(2048).optional(),
  referrer: z.string().max(2048).optional(),
  properties: propertiesSchema,
  utm: z.record(z.string(), z.string().max(255)).optional(),
});

export const ingestionBatchSchema = z.object({
  projectKey: z.string().min(12).max(255).optional(),
  events: z.array(ingestionEventSchema).min(1).max(MAX_BATCH_EVENTS),
});

export type IngestionEvent = z.infer<typeof ingestionEventSchema>;
