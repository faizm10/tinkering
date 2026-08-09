# Life Admin

Life Admin turns natural-language life situations into structured plans. A user can describe a move, trip, purchase, refund, renewal, or follow-up; the agent drafts a life event with tasks, reminders, deadlines, and waiting items; the user reviews and approves the proposal before anything is saved.

## Architecture

The app is a Next.js App Router application with server-side provider boundaries:

- `AuthProvider`: `DemoAuthProvider` now, `BetterAuthProvider` later.
- `DataRepository`: `MemoryDataRepository` now, `DrizzleDataRepository` for Neon/PostgreSQL later.
- `AgentProvider`: `MockAgentProvider` now, `OpenAIAgentProvider` later.

Application services depend on these interfaces rather than direct OpenAI, Neon, or Better Auth calls. The provider factory lives in `src/server/providers/index.ts`.

## Demo Mode

The app runs without external credentials by default:

```bash
APP_MODE=demo
DATA_PROVIDER=memory
AI_PROVIDER=mock
AUTH_PROVIDER=demo
```

Demo mode uses one stable server-side demo user and in-memory data for the current server process. It is intentionally temporary storage. Production mode will not allow demo auth, memory data, or the mock agent.

## Environment

Copy `.env.example` to `.env.local` and fill only what you need:

```bash
APP_MODE=demo
DATA_PROVIDER=memory
AI_PROVIDER=mock
AUTH_PROVIDER=demo

DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
CRON_SECRET=
```

To enable production providers later:

- Neon: set `DATA_PROVIDER=postgres` and `DATABASE_URL`.
- Better Auth: set `AUTH_PROVIDER=better-auth`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`.
- OpenAI: set `AI_PROVIDER=openai`, `OPENAI_API_KEY`, and `OPENAI_MODEL`.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run e2e
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Database

Drizzle schemas cover Better Auth tables plus profiles, life events, tasks, reminders, waiting items, agent proposals, agent runs, and activity logs. Migrations include indexes, foreign keys, RLS assumptions, provider columns for agent runs, and activity actors.

Generate and apply migrations with:

```bash
npm run db:generate
npm run db:migrate
```

Do not use schema push in production.

## Agent Safety

The agent runs only on the server. Mock and OpenAI providers share the same strict Zod proposal schema. Agent output is stored as a pending proposal, never as permanent records. Approval validates the edited plan again and writes the life event, tasks, reminders, waiting items, and activity history as one repository operation.

The MVP does not send email, make purchases, make payments, cancel services, store banking credentials, or store government ID values.

## Testing

Tests run without OpenAI, Neon, or Better Auth:

```bash
npm test
npm run e2e
```

Coverage includes environment validation, proposal validation, date parsing, mock-agent scenarios, RLS assumptions, ownership checks, approval duplicate prevention, and the provider-backed vertical slice.

## Limitations

`DrizzleDataRepository` is intentionally a production boundary stub until real Neon credentials are available. The schema and migrations are ready, and demo mode exercises the full user flow through the same service interfaces.
