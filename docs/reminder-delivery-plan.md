# Reminder Delivery Plan

## Decision

Use QStash for scheduling and Resend for email delivery.

This is the best side-project fit for Sonae right now because it avoids a permanently running worker, handles delayed jobs and retries outside the app process, and stays inexpensive at low reminder volume. Vercel Cron remains useful as a daily recovery sweep, but it is not the primary timer because the Hobby tier is daily-only.

## Runtime Flow

1. The user creates a reminder manually or approves an agent proposal containing reminders.
2. Sonae stores the reminder with delivery metadata:
   - `deliveryStatus`
   - `deliveryVersion`
   - `deliveryRecipientEmail`
   - QStash message metadata
   - attempt/error timestamps
3. The scheduler resolves the recipient email from Settings, falling back to the signed-in account email.
4. If delivery keys are missing, the reminder stays `pending` and records a clear `lastError`.
5. If keys are present, Sonae publishes a QStash job with `notBefore` set to the reminder timestamp.
6. QStash calls `POST /api/reminders/deliver`.
7. The worker verifies the request, reloads the reminder, checks `deliveryVersion`, sends the email with Resend, and marks the reminder `sent`.

## Stale Edit Protection

Every reminder starts at `deliveryVersion = 1`.

When a reminder is edited, Sonae:

- increments `deliveryVersion`
- resets delivery state to `pending`
- clears old QStash metadata and delivery errors
- queues a fresh QStash message when keys are present

If an old QStash message arrives later, its payload has the old version and the worker ignores it.

## Missing Keys Behavior

The app must build and run before API keys are added. Missing keys never block reminder creation.

Required keys for live delivery:

- `APP_BASE_URL`
- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`

Until those are present, reminders remain in `pending` delivery state. After keys are added, call `GET /api/cron/reminders` with `Authorization: Bearer <CRON_SECRET>` or wait for Vercel Cron.

## Recovery Sweep

`GET /api/cron/reminders` does two jobs:

- queues pending or failed reminders inside QStash's scheduling window
- directly attempts reminders that are already due

This covers:

- keys being added after reminders were created
- QStash publish failures
- missed callbacks
- reminders too far in the future to queue immediately

## Security

The delivery worker accepts either:

- a valid QStash signature when signing keys are configured
- `Authorization: Bearer <CRON_SECRET>` as the fallback path

The fallback lets local/staging use QStash without signing keys during setup. Production should include QStash signing keys.

## Operational Checklist

1. Run `npm run db:migrate`.
2. Verify the sender domain in Resend.
3. Add all reminder env vars in the deployment provider.
4. Deploy.
5. Trigger `GET /api/cron/reminders` once with the cron bearer token.
6. Create a test reminder one or two minutes in the future.
7. Confirm the reminder row moves from `pending` to `scheduled` to `sent`.

## Failure States

- `pending`: waiting for keys, waiting to be queued, or ready for cron recovery.
- `scheduled`: queued in QStash.
- `sending`: worker started an email attempt.
- `sent`: email was accepted by Resend.
- `failed`: send attempt failed and can be retried by cron.
- `skipped`: reserved for explicit future non-delivery behavior.
- `cancelled`: reserved for future soft-cancel behavior.
