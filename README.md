# Operations Triage

A small authenticated app for logging incoming operational requests and triaging them — prioritizing, categorizing, assigning, and tracking each one to resolution.

- **Live:** https://miguel-cgk-ai-dev-trial.vercel.app
- **Repo:** https://github.com/miguel-cgk/cgk-ai-dev-trial

## Reviewer quickstart

1. Open the live URL and click **Sign in to start**.
2. Sign in with the demo account:
   - **Email:** `miguel.cgk@gmail.com`
   - **Password:** `miguelcgk2026`
3. You'll land on the dashboard with a seeded queue. Try: filtering by status/priority/category, searching, creating a request (watch the **triage suggestion**), editing priority/status inline, and opening a request to add notes / view its activity timeline.

You can also sign up with your own email — it's a live Clerk instance.

## Features

- Public landing page with a sign-in CTA
- Server-protected dashboard (middleware + per-action checks — not just hidden links)
- Request queue: title, requester, category, priority, status, owner, created date
- Search and filters (status, priority, category)
- Create requests with a **rule-based triage suggestion** (priority + category, with reasons)
- Inline edit of priority/status; assign / unassign owner
- Request detail view: description, notes, and an activity timeline
- Responsive — table on desktop, cards on mobile

## Tech stack

- **Next.js 15** (App Router) + **TypeScript**
- **Clerk** — authentication
- **Prisma 6** + **Neon Postgres**
- **Tailwind CSS v4** + **shadcn/ui**
- **Zod** (input validation), **Vitest** (triage tests)
- Deployed on **Vercel**

## Authentication architecture

- **Provider:** Clerk (email + password).
- **Edge gate:** `middleware.ts` runs `clerkMiddleware` and protects `/dashboard(.*)` with `auth.protect()`. Unauthenticated requests are redirected (browser navigations) or rewritten to 404 (non-document requests) — enforced server-side at the edge.
- **Defense in depth:** every protected page/layout and **every Server Action** calls `requireUser()` (`lib/auth.ts`), which reads `auth()` and redirects to `/sign-in` when there's no session. Mutations never trust the middleware alone.
- **No REST layer:** all writes are **Server Actions** (`lib/requests/actions.ts`). Each validates input with Zod and writes the record **plus a matching activity event in one transaction**.
- **Identity:** Clerk is the system of record. Owners, creators, and note authors are stored as a Clerk user id + a display-name snapshot — there is no local `User` table and no user-sync webhooks.
- **States:** signed-out → redirect + landing CTA; loading → route `loading.tsx` skeletons; errors → `error.tsx` boundary and typed action results surfaced as toasts.
- **Secrets:** all keys live in a gitignored `.env`; only `.env.example` is committed.

## Local setup

```bash
git clone https://github.com/miguel-cgk/cgk-ai-dev-trial
cd cgk-ai-dev-trial
npm install
cp .env.example .env     # then fill in the values (see below)
npm run db:migrate       # apply the schema to your database
npm run db:seed          # optional: load ~12 demo requests
npm run dev              # http://localhost:3000
```

## Environment variables

| Variable                                          | Required    | Purpose                                                 |
| ------------------------------------------------- | ----------- | ------------------------------------------------------- |
| `DATABASE_URL`                                    | yes         | Pooled Neon Postgres connection (runtime)               |
| `DIRECT_URL`                                      | yes         | Direct/unpooled connection (migrations)                 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`               | yes         | Clerk publishable key                                   |
| `CLERK_SECRET_KEY`                                | yes         | Clerk secret key                                        |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`                   | recommended | `/sign-in` (use the in-app page, not the hosted portal) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`                   | recommended | `/sign-up`                                              |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | recommended | `/dashboard`                                            |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | recommended | `/dashboard`                                            |
| `SEED_OWNER_USER_ID`                              | seed only   | Clerk user id that owns seeded requests                 |
| `SEED_OWNER_NAME`                                 | seed only   | Display name for the seed owner (default `John Doe`)    |

## Deployment notes (Vercel)

- Import the repo; the Next.js preset is auto-detected. `postinstall` runs `prisma generate`.
- Set the env vars above in the Vercel project. The Neon integration can provide `DATABASE_URL`; add `DIRECT_URL` and the Clerk keys.
- The schema is applied with `npm run db:migrate` locally. Once additional migrations exist, set the Vercel build command to `prisma migrate deploy && next build` so they apply on deploy (this is why `DIRECT_URL` is set in Vercel).
- Clerk **development** keys work on the `*.vercel.app` domain with no extra configuration.

## Data model

Three tables — `Request`, `Note`, `ActivityEvent` — plus enums for `Status`, `Priority`, `Category`, and `ActivityType`. See [`prisma/schema.prisma`](./prisma/schema.prisma). Domain terms are defined in [`CONTEXT.md`](./CONTEXT.md).

## Assumptions & tradeoffs

- **Clerk over hand-rolled auth** — fastest path to every auth requirement; cost is a SaaS dependency. (ADR 0002)
- **No local `User` table** — Clerk is the identity source of record; owners/authors are id + name snapshots. (ADR 0003)
- **Server Actions, no REST API** — less boilerplate and end-to-end types; protection lives in the actions. (ADR 0004)
- **Rule-based triage, not an LLM** — deterministic, testable, no extra secret or review-time dependency. (see [AI_WORKFLOW.md](./AI_WORKFLOW.md))
- **Pinned Next/Clerk/Prisma to stable majors** — the newest majors shipped breaking config changes not worth the time on a short build. (ADR 0001, AI_WORKFLOW.md)
- **Requester is free text** — the person needing help usually isn't an app user.
- **Out of scope (deliberately):** delete, teams, notifications, billing, admin/enterprise.

## Project structure

```
app/                  routes: landing, sign-in/up, dashboard, request detail
components/ui/         shadcn/ui primitives
components/requests/   feature components (toolbar, create dialog, selects, forms)
lib/auth.ts            requireUser()
lib/requests/          queries, actions, validation, display, filters
lib/triage/            TriageStrategy interface + rule engine + tests
prisma/                schema, migrations, seed
docs/adr/              architecture decision records
CONTEXT.md             domain glossary
```

## Testing

```bash
npm run test     # Vitest — triage rule engine
npm run build    # production build (TypeScript + ESLint + compile)
```
