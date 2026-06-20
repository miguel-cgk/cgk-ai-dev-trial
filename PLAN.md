# Operations Triage — Execution Plan

Design decisions are recorded in `docs/adr/` and the domain glossary in `CONTEXT.md`. This file is the build plan.

## 1. Architecture

- **Next.js App Router (TypeScript)** on **Vercel**. Server Components for reads, Server Actions for writes. No REST layer.
- **Clerk** for authentication (email + password). `clerkMiddleware` gates `/dashboard`; every protected page and every Server Action calls `requireUser()` (defense in depth).
- **Neon Postgres + Prisma**. Prisma schema is the single source of truth for the data model and the parallelization contract.
- **Rule-based triage helper** as a pure function behind a `TriageStrategy` interface — deterministic, unit-tested, no external API.
- **shadcn/ui + Tailwind** for UI. Responsive table→cards.

## 2. Stack selection

| Concern | Choice | Why |
|---|---|---|
| Framework/host | Next.js App Router / Vercel | Most-paved Clerk + Vercel path; de-risks the binary deploy |
| Auth | Clerk | Ticks every auth requirement with least time; free signed-out/loading states |
| DB | Neon Postgres | Free, serverless-friendly, native Vercel integration (auto-wired env) |
| ORM | Prisma | Schema-as-docs, type-safe, strong AI assist, seed script |
| UI | shadcn/ui + Tailwind | Own the code, accessible (Radix), polished default, fast |
| Validation | Zod | Validate action inputs server-side |
| Triage | Rule engine | Deterministic, testable, no secret, no review-time live dependency |

## 3. Database schema (`prisma/schema.prisma`)

```prisma
generator client { provider = "prisma-client-js" }
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Status { TRIAGE IN_PROGRESS BLOCKED RESOLVED }
enum Priority { LOW MEDIUM HIGH URGENT }
enum Category { ACCESS INCIDENT DATA QUESTION OTHER }
enum ActivityType { CREATED STATUS_CHANGED PRIORITY_CHANGED OWNER_CHANGED NOTE_ADDED }

model Request {
  id            String   @id @default(cuid())
  title         String
  description   String?
  requester     String                 // free text
  category      Category
  priority      Priority @default(MEDIUM)
  status        Status   @default(TRIAGE)
  ownerId       String?                 // Clerk user id, null = unassigned
  ownerName     String?                 // display snapshot
  createdById   String                  // Clerk user id
  createdByName String                  // display snapshot
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  notes         Note[]
  activity      ActivityEvent[]

  @@index([status])
  @@index([priority])
  @@index([category])
  @@index([createdAt])
}

model Note {
  id         String   @id @default(cuid())
  requestId  String
  request    Request  @relation(fields: [requestId], references: [id], onDelete: Cascade)
  authorId   String
  authorName String
  body       String
  createdAt  DateTime @default(now())
  @@index([requestId])
}

model ActivityEvent {
  id        String   @id @default(cuid())
  requestId String
  request   Request  @relation(fields: [requestId], references: [id], onDelete: Cascade)
  type      ActivityType
  actorId   String
  actorName String
  field     String?
  fromValue String?
  toValue   String?
  createdAt DateTime @default(now())
  @@index([requestId])
}
```

## 4. Auth strategy

- `ClerkProvider` in `app/layout.tsx`.
- `middleware.ts`: `clerkMiddleware` + `createRouteMatcher(['/dashboard(.*)'])` → `auth.protect()`.
- `lib/auth.ts` → `requireUser()`: reads `auth()`, redirects to `/sign-in` if no `userId`, returns `{ id, name }` from `currentUser()`. Called by the dashboard layout AND every Server Action.
- States: signed-out → middleware redirect + landing CTA; loading → `<ClerkLoading>` + `loading.tsx` + `useFormStatus`; error → `error.tsx` + typed action results.
- Secrets in env only; demo login documented in README (a demo credential is not a secret).

## 5. Route structure

```
app/
  layout.tsx                       # ClerkProvider, Toaster
  page.tsx                         # public landing + Sign in CTA
  sign-in/[[...sign-in]]/page.tsx
  sign-up/[[...sign-up]]/page.tsx
  dashboard/
    layout.tsx                     # requireUser() gate + nav/UserButton
    page.tsx                       # queue (searchParams -> listRequests)
    loading.tsx
    error.tsx
    requests/[id]/
      page.tsx                     # detail: getRequest -> request + notes + activity
      not-found.tsx
middleware.ts
lib/
  db.ts                            # Prisma singleton
  auth.ts                          # requireUser()
  requests/
    queries.ts                     # listRequests(filters), getRequest(id)
    actions.ts                     # 'use server' mutations (each requireUser)
    validation.ts                  # zod schemas
  triage/
    types.ts                       # TriageStrategy, TriageInput, TriageResult
    rules.ts                       # rule-based impl
    rules.test.ts
prisma/
  schema.prisma
  seed.ts
components/                        # shadcn + app components
```

### Frozen contracts (the spine)

```ts
// lib/auth.ts
export async function requireUser(): Promise<{ id: string; name: string }>;

// lib/requests/queries.ts
export type RequestFilters = { q?: string; status?: Status; priority?: Priority; category?: Category };
export function listRequests(f: RequestFilters): Promise<Request[]>;
export function getRequest(id: string): Promise<(Request & { notes: Note[]; activity: ActivityEvent[] }) | null>;

// lib/requests/actions.ts  ('use server')
export function createRequest(input: CreateRequestInput): Promise<{ id: string } | { error: string }>;
export function updateStatus(id: string, status: Status): Promise<ActionResult>;
export function updatePriority(id: string, priority: Priority): Promise<ActionResult>;
export function assignOwner(id: string, assign: boolean): Promise<ActionResult>; // assign self / unassign
export function addNote(id: string, body: string): Promise<ActionResult>;

// lib/triage/types.ts
export type TriageInput = { title: string; description?: string; category?: Category };
export type TriageResult = { priority: Priority; category: Category; reasons: string[] };
export interface TriageStrategy { suggest(input: TriageInput): TriageResult }
```

Every action: `requireUser()` → validate (zod) → write Request/Note + matching `ActivityEvent` in one transaction → `revalidatePath`.

## 6. UI plan

- **Landing (`/`)**: hero, one-line pitch, 3 feature bullets, Clerk Sign-in CTA. Responsive.
- **Queue (`/dashboard`)**: toolbar = search (`?q`) + Status/Priority/Category `Select`s (`?status/?priority/?category`) + "New request" (dialog with create form + live triage suggestion). Table columns: Title, Requester, Category, Priority badge, Status badge, Created, Owner. Inline `Select` for status/priority edits → action. Collapses to cards on mobile. Row → detail.
- **Detail (`/dashboard/requests/[id]`)**: header (title, badges, requester, owner, Assign-to-me, status/priority selects), description, two columns: Notes (list + add-note form) | Activity timeline. Stacks on mobile.
- shadcn: table, badge, select, dialog, input, textarea, button, card, separator, skeleton, sonner.

## 7. AI helper approach

- Pure `RuleTriageStrategy implements TriageStrategy`.
- Category baselines: `INCIDENT→HIGH`, `ACCESS→MEDIUM` (HIGH if login/lockout keywords), `DATA→MEDIUM`, `QUESTION→LOW`, `OTHER→MEDIUM`.
- Urgency keywords (title+description, lowercased): `outage, down, production/prod, breach, data loss, locked out, can't login, urgent, asap` → push to `HIGH`/`URGENT`.
- Final priority = max(category baseline, keyword signal). `reasons[]` explains each contribution (human-readable).
- Category suggestion from keywords when the user hasn't picked one.
- Unit-tested in `rules.test.ts`. The `TriageStrategy` seam documents where an LLM could drop in (future work) — and is the headline rejected-AI entry in `AI_WORKFLOW.md`.

## 8. Development sequence

**Phase 0 — Spine (1 agent, ~30 min):** scaffold Next+TS, init Tailwind+shadcn, write `prisma/schema.prisma`, `prisma migrate` + generate, install Clerk, stub `lib/auth`, `lib/requests/{queries,actions,validation}`, `lib/triage/types`. Commit, push, **deploy skeleton to Vercel with Clerk + Neon envs and confirm sign-in works in prod** (de-risk the binary deploy first).

**Phase 1 — Parallel (3 agents):**
- **Agent 1 — Auth + Shell**
- **Agent 2 — Data + Features** (queries, actions, seed, queue UI, detail UI)
- **Agent 3 — Triage + Docs**

**Phase 2 — Integrate (1 agent):** wire create form ↔ triage suggestion, replace stubs, seed prod DB, end-to-end click-through, finalize README with real reviewer creds, final deploy.

## 9. Parallel agent briefs (paste into subagents)

### Agent 1 — Auth + Shell
> Build Clerk auth + app shell for a Next.js App Router (TS) project. Implement: `ClerkProvider` in `app/layout.tsx`; `middleware.ts` with `clerkMiddleware` protecting `/dashboard(.*)`; `lib/auth.ts` `requireUser()` (redirect to `/sign-in` if unauthenticated, return `{id,name}`); `app/sign-in` + `app/sign-up` catch-all routes; public landing `app/page.tsx` with Sign-in CTA; `app/dashboard/layout.tsx` (calls `requireUser()`, renders nav + `<UserButton>`), `loading.tsx`, `error.tsx`. Handle signed-out/loading/error states. Do NOT touch `lib/requests/*` or feature pages. Contracts: `requireUser(): Promise<{id:string;name:string}>`.

### Agent 2 — Data + Features
> Implement the data layer and feature UI against the frozen Prisma schema. (a) `lib/db.ts` Prisma singleton; (b) `lib/requests/queries.ts` (`listRequests`, `getRequest`) and `lib/requests/actions.ts` Server Actions (`createRequest`, `updateStatus`, `updatePriority`, `assignOwner`, `addNote`) — each calls `requireUser()`, validates with zod, writes the record + a matching `ActivityEvent` in one transaction, `revalidatePath`; (c) `prisma/seed.ts` (~12 varied requests, notes, activity; honor `SEED_OWNER_USER_ID`); (d) queue page `/dashboard` (toolbar search + filters via searchParams, responsive table→cards, inline status/priority edit); (e) detail `/dashboard/requests/[id]` (notes list + add form, activity timeline) and the New-request dialog form. Import `requireUser` and `TriageStrategy` as given. Use shadcn components.

### Agent 3 — Triage + Docs
> (a) Implement `lib/triage/rules.ts` (`RuleTriageStrategy implements TriageStrategy`) per the rules in PLAN.md §7, plus `lib/triage/rules.test.ts` (Vitest) covering category baselines, keyword escalation, and reasons output. (b) Write `README.md` (per §11) and `AI_WORKFLOW.md` (per §12) and `.env.example`. Pure logic only — no DB, no auth, no React. Contract: `TriageStrategy.suggest(input): TriageResult`.

## 10. Deployment checklist

- [ ] Neon DB created via Vercel integration; `DATABASE_URL` (pooled) + `DIRECT_URL` set in Vercel.
- [ ] Clerk app created; email+password enabled; `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (+ sign-in/up URL envs) set in Vercel.
- [ ] Demo user created in Clerk; `userId` → `SEED_OWNER_USER_ID`.
- [ ] `prisma generate` in postinstall; `prisma migrate deploy` on build.
- [ ] Seed run once against prod DB.
- [ ] Verify: unauth `/dashboard` → redirect; demo sign-in works; create/edit/note/assign work; filters + search work; mobile layout; `error.tsx`/`loading.tsx` behave.
- [ ] `.env.example` committed; no secrets in repo; `.env*` gitignored.

## 11. README outline

1. Title + one-line pitch + **live URL**
2. **Reviewer quickstart** (demo creds + link) — at the top
3. Features
4. Tech stack
5. **Authentication architecture** (Clerk, middleware gate, `requireUser()`, action protection, states) — required
6. Local setup (clone, env, db, migrate, seed, dev)
7. Environment variables (table)
8. Deployment notes (Vercel, Neon, Clerk)
9. Data model (link to schema + CONTEXT.md)
10. **Assumptions & tradeoffs** (summarize ADRs) — required
11. Project structure / parallelization seams

## 12. AI_WORKFLOW.md outline

1. Tools used (Cursor + model; grilling + domain-modeling design session)
2. How AI was used per phase (spine, 3 parallel agents, integration)
3. Important prompts (design grilling, schema, triage rules, component generation) + review process
4. **Rejected/modified suggestions** (required): (1) LLM-backed triage → rejected for deterministic rule engine; (2) mirror Clerk users into a local User table → rejected for Clerk-as-system-of-record; (3) any over-abstraction trimmed
5. Verification/testing: types, lint, triage unit tests, manual auth checks (unauth redirect, action protection), e2e click-through
```
