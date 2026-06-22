# AI Workflow

## Tools

- **Cursor** with Claude (agent mode) for design, scaffolding, and implementation.
- A structured **design interview** ("grilling") plus a **domain-modeling** pass up front. Decisions were captured as ADRs (`docs/adr/`) and a glossary (`CONTEXT.md`) _before_ writing code.

## How AI was used, by phase

1. **Design review (no code).** An interviewer-style session worked through the eight highest-impact decisions — auth provider, framework, database, data model, triage approach, route protection, UI kit, and parallelization — one at a time, each with explicit tradeoffs. Lock-in decisions became ADRs.
2. **Spine.** Scaffolded Next.js + Clerk + Prisma, wrote the schema, and stubbed the "frozen contracts" (`requireUser`, the queries/actions signatures, and the `TriageStrategy` interface) so the rest of the app could be built against stable interfaces. A deployable skeleton went to Vercel first to de-risk the binary deployment step.
3. **Features.** Implemented the Server Actions, the queue and detail UI, the triage engine, and the seed.
4. **Docs.** README, this file, and `.env.example`.

## Important prompts & review process

- _"You are acting as a senior staff engineer, product architect; identify the decisions that most create product value, one at a time, with tradeoffs."_ → produced the decision log and ADRs.
- _"Freeze the contracts first so feature work can proceed against interfaces."_ → the `lib/*` stubs.
- Every AI-generated file was reviewed for: correct server/client boundaries, mutations re-checking auth, Zod validation on untrusted input, and no secrets in code. The **production build** (TypeScript + ESLint) and the **triage unit tests** were the automated gates.

## AI code review (Bugbot)

After Phase 1, an AI review subagent was run over the diff with the auth/boundary/transaction checklist as custom instructions.

**Why it helped:** the AI review acted as a second reviewer focused on UI-state/URL-sync and error-path edge cases that are easy to miss by eye and that neither the type checker nor the existing tests would catch. It returned precise `file:line` findings with rationale, which made each fix a small, targeted change. All gates were re-run green afterward.

## AI suggestions that were rejected or modified

1. **LLM-backed triage → rejected in favor of a rule engine.** The flashier option (call an LLM to set priority) was rejected: it adds a secret, latency, a failure path, and a fragile review-time dependency, and it can't be unit-tested deterministically. A pure `TriageStrategy` rule engine gives explainable, tested suggestions — and the interface still leaves room to drop an LLM in behind it later.
2. **Mirror Clerk users into a local `User` table → rejected.** Proposed for "correctness," but it drags in webhooks and a sync failure mode. Clerk is the system of record instead; we store user id + name snapshots (ADR 0003).
3. **"Use the latest of everything" → modified.** A plain `npm install` pulled **Next 16, Clerk 7, and Prisma 7**. Clerk 7 had removed `<SignedIn>/<SignedOut>` and Prisma 7 had dropped `url`/`directUrl` from the schema — both breaking changes with thin docs at the time. Pinned to **Next 15 / Clerk 6 / Prisma 6** (stable, well-documented) rather than spend the budget adapting to brand-new majors (ADR 0001).
4. **A `404` on `/dashboard` looked like a routing bug → investigated, not "fixed".** A `curl` to the deployed `/dashboard` returned 404. The response headers showed `X-Clerk-Auth-Reason: protect-rewrite` and `X-Clerk-Auth-Status: signed-out` — i.e., protection working as intended for non-document requests. A browser-style request (`Accept: text/html`) correctly returns a `307` redirect. No code change; the instinct to "fix" it was wrong.

## Verification / testing

- `npm run test` — Vitest covers the triage engine: category baselines, keyword escalation to HIGH/URGENT, category detection from text, and that every suggestion includes human-readable reasons.
- `npm run build` — the production build runs TypeScript and ESLint; it must pass before deploy.
- **Manual auth checks** — verified (via HTTP response headers in production) that an unauthenticated `/dashboard` request is blocked server-side, and that each mutation re-checks `requireUser()`.
- **Deployment** — verified the live landing page, sign-in, and the protected dashboard on Vercel.
