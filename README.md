# Life Admin

Life Admin is a production-oriented MVP for turning personal life situations into structured plans. Users describe a move, trip, purchase, refund, renewal, or follow-up. The agent drafts a proposal with one life event, tasks, reminders, and waiting items. Nothing becomes permanent until the user reviews and approves it.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui
- Neon PostgreSQL with Drizzle ORM and Drizzle Kit
- Better Auth for email/password sessions
- OpenAI Responses API with function calling
- Zod validation, Vitest, Playwright

## Environment

Copy `.env.example` to `.env.local` and fill:

```bash
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
CRON_SECRET=
```

Without `DATABASE_URL` or `OPENAI_API_KEY`, the app uses a local demo store and fake model adapter so the interface and tests can run without external services.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run db:generate
npm run db:migrate
npm run db:seed
npm run e2e
```

## Database

The Drizzle schema defines Better Auth tables plus profiles, life events, tasks, reminders, waiting items, agent proposals, agent runs, and activity logs. Tables use user-scoped foreign keys, indexes for common dashboard queries, and enum-backed status fields.

Generate migrations with `npm run db:generate`, then apply them with `npm run db:migrate`. Do not use schema push in production.

## Agent Safety Model

The agent runs server-side only. It validates input and output with Zod, limits tool steps, logs tool calls, and creates pending proposals rather than permanent records. The MVP never sends email, makes purchases, cancels services, stores credentials, or stores government ID values.

## Approval System

Pending proposals can be edited, approved, or rejected. Approval validates the edited proposal, prevents duplicate approval, creates the life event and related items, records activity, and redirects to the event detail screen.

## Known Limitations

The local demo store is intentionally ephemeral. Real production persistence requires Neon credentials and running Drizzle migrations. External integrations, notifications, uploads, shared family events, and automatic external actions are extension points, not part of this MVP.
