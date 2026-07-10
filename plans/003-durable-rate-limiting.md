# Plan 003: Make rate limiting effective on Vercel serverless (Postgres-backed store)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d0d0d2a..HEAD -- src/server.js prisma/schema.prisma lib/server/ tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (but land 001 and 002 first if possible — smaller diffs, same file)
- **Category**: security
- **Planned at**: commit `d0d0d2a`, 2026-07-09

## Why this matters

The app's rate limiters (`express-rate-limit`) use the default **in-memory** store. In this repo the Express app (`src/server.js`) is mounted into Next.js API routes via `lib/server/express-next-handler` and deployed to Vercel as serverless functions — each function instance is a separate process with its own memory, instances are created and destroyed constantly, and concurrent requests land on different instances. Result: the auth limiter (20 failed attempts / 15 min, protecting login/register/password-reset from credential stuffing) and the crawl limiter (2/min) enforce almost nothing in production. The fix is a shared store. This plan uses the **existing Postgres database via Prisma** as the store — no new infrastructure, no new secrets — accepting one extra DB roundtrip on the five auth endpoints and the crawl endpoint only.

## Current state

- `src/server.js` — the Express app with all API logic. Limiters defined at lines 357–375, applied at lines 2626, 2726, 2747, 2788, 2829 (auth endpoints) and 4243 (crawl).
- `prisma/schema.prisma` — Prisma schema; models include User, Subscription, Project, CrawlRun, CrawlRunPage.
- `lib/prisma.ts` — the shared PrismaClient singleton. `src/server.js` already talks to Prisma (verify which import it uses and reuse the same one).
- Deploy model: Vercel serverless. `vercel.json` sets per-endpoint `maxDuration`; there is no long-lived server process.

The limiter definitions, `src/server.js:357-375`:

```js
const crawlLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.CRAWL_MAX_PER_MIN
    ? parseInt(process.env.CRAWL_MAX_PER_MIN)
    : 2,
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for auth endpoints (login, register, forgot-password, resend-verification)
// Limits brute-force and credential stuffing attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intenta de nuevo en 15 minutos." },
  skipSuccessfulRequests: true, // only count failed requests
});
```

Application sites (unchanged by this plan): `app.post("/api/auth/register", authLimiter, ...)` at 2626, resend-verification 2726, login 2747, forgot-password 2788, reset-password 2829, and `app.get("/api/crawl", crawlLimiter, requireAuth, requireEditor, ...)` at 4243.

`express-rate-limit` is at `^6.8.0` (package.json). Its Store interface in v6 is: `init(options)`, `increment(key) -> { totalHits, resetTime }`, `decrement(key)`, `resetKey(key)` — `increment` is what matters; `decrement` is called when `skipSuccessfulRequests` is true and the request succeeded.

Repo conventions: user-facing error strings in Spanish; server-side helpers for the Express app live in `lib/server/`; schema changes are applied with `npm run db:push` (no migration files — the repo uses `prisma db push`).

## Commands you will need

| Purpose        | Command                                  | Expected on success |
|----------------|------------------------------------------|---------------------|
| Apply schema   | `npm run db:push`                        | "Your database is now in sync" |
| Regenerate     | `npm run prisma:generate`                | exit 0              |
| Tests          | `npm test -- tests/rate-limit.test.js`   | all pass            |
| Full tests     | `npm test`                               | all pass            |
| Build          | `npm run build`                          | exit 0              |

Requires local Postgres (`npm run db:up`) and `.env.local`.

## Scope

**In scope** (the only files you should modify/create):
- `prisma/schema.prisma` — add one model
- `lib/server/rate-limit-store.js` (create)
- `src/server.js` — only the two `rateLimit({...})` option objects (add `store:`)
- `tests/rate-limit.test.js` (create)

**Out of scope** (do NOT touch):
- Which endpoints are rate limited, the window sizes, or the max values — behavior-preserving store swap only.
- Adding Redis/Upstash or any new external service.
- `lib/server/express-next-handler` and how the app is mounted.
- Key generation / IP extraction (`req.ip` handling, trust proxy settings) — if you find `trust proxy` is NOT configured, note it in your report as a follow-up finding; do not change it here.

## Git workflow

- Branch: `advisor/003-durable-rate-limiting`
- Commit style: gitmoji + short description, e.g. `:shield: Postgres-backed rate limit store for serverless`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the Prisma model

In `prisma/schema.prisma`, add:

```prisma
model RateLimitEntry {
  key       String   @id
  count     Int      @default(0)
  expiresAt DateTime

  @@index([expiresAt])
}
```

**Verify**: `npx prisma validate` → "The schema ... is valid". Then `npm run db:push` → success, and `npm run prisma:generate` → exit 0.

### Step 2: Implement the store

Create `lib/server/rate-limit-store.js` exporting a class `PrismaRateLimitStore` implementing the express-rate-limit v6 Store interface. Requirements:

- Constructor takes `{ prisma, prefix }` (prefix distinguishes the two limiters, e.g. `"auth"` / `"crawl"`).
- `init(options)`: save `options.windowMs`.
- `async increment(key)`: full key = `` `${prefix}:${key}` ``. In one atomic operation, upsert the row: if it doesn't exist OR its `expiresAt` is in the past, reset it to `count: 1, expiresAt: now + windowMs`; otherwise increment `count`. Implement with `prisma.$transaction` (read + conditional write) or a single raw `INSERT ... ON CONFLICT` — atomicity matters, this is exactly the check-then-act trap. Return `{ totalHits: row.count, resetTime: row.expiresAt }`.
- `async decrement(key)`: decrement `count` (floor at 0) if the row exists and is unexpired; swallow not-found.
- `async resetKey(key)`: delete the row; swallow not-found.
- Opportunistic cleanup: inside `increment`, with probability ~1% (`Math.random() < 0.01`), fire-and-forget `deleteMany({ where: { expiresAt: { lt: new Date() } } })` — do not await it on the request path.
- **Fail open**: wrap DB errors so a Postgres hiccup logs a warning and returns `{ totalHits: 1, resetTime: new Date(Date.now() + windowMs) }` instead of throwing — rate limiting must never take down login.
- Import the same Prisma instance `src/server.js` already uses (check its require of `lib/prisma` and match it).

**Verify**: `node -e "const S = require('./lib/server/rate-limit-store'); console.log(typeof S)"` → `function`.

### Step 3: Wire the store into both limiters

In `src/server.js`, add to the `crawlLimiter` options: `store: new PrismaRateLimitStore({ prisma, prefix: "crawl" })`, and to `authLimiter`: `store: new PrismaRateLimitStore({ prisma, prefix: "auth" })` (require the class near the other requires at the top of the file). Change nothing else in the option objects. Note: the `prisma` client must already be initialized at line ~357 — if the client is required lower in the file, move the store construction after it or require the client directly in the store module.

**Verify**: `node -e "require('./src/server')"` → exits 0.

### Step 4: Tests

Create `tests/rate-limit.test.js` using the bootstrap pattern from `tests/auth.test.js:1-29` (env loading + `const app = require("../src/server")`). Test the STORE directly plus one endpoint integration:

1. Store unit: `increment` the same key `windowMs`-fresh twice → `totalHits` goes 1 then 2, same `resetTime`.
2. Store unit: create an entry with `expiresAt` in the past directly via Prisma, then `increment` → `totalHits` resets to 1 with a new future `resetTime`.
3. Store unit: `decrement` after two increments → row count is 1 (read via Prisma).
4. Store unit: `resetKey` → row gone.
5. Persistence across "instances": construct TWO separate `PrismaRateLimitStore` objects with the same prefix, increment the same key once on each → second returns `totalHits: 2`. (This is the serverless scenario the fix exists for.)
6. Endpoint integration: POST `/api/auth/login` with a wrong password for a nonexistent email 21 times via supertest → the 21st response is HTTP 429 with body `{ error: "Demasiados intentos. Intenta de nuevo en 15 minutos." }`. Use a unique fake IP via `X-Forwarded-For` if the limiter keys on `req.ip` and jest workers share an IP; clean up `RateLimitEntry` rows in `afterAll`.

**Verify**: `npm test -- tests/rate-limit.test.js` → all pass.

### Step 5: Full regression

**Verify**: `npm test` → all pass. IMPORTANT: `tests/auth.test.js` makes many auth requests; if it now trips the 20-failure limiter, clear `RateLimitEntry` rows in that suite's `beforeAll` (this is the one permitted touch outside the in-scope list — a `deleteMany` line in the existing test setup; note it in your report). Then `npm run build` → exit 0.

## Test plan

Covered in Step 4. Model file structure after `tests/auth.test.js`. The essential case is #5 (two store instances share state through Postgres) — it proves the serverless fix.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "store: new PrismaRateLimitStore" src/server.js` → 2 matches
- [ ] `grep -n "model RateLimitEntry" prisma/schema.prisma` → 1 match
- [ ] `npm test -- tests/rate-limit.test.js` exits 0 with ≥6 tests passing
- [ ] `npm test` exits 0
- [ ] `npm run build` exits 0
- [ ] `git status` shows only in-scope files (plus optionally `tests/auth.test.js` per Step 5) modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `express-rate-limit` in `node_modules` is v7+ (its Store interface differs: `increment` key/args changed) — report the installed version and stop.
- The limiter code at `src/server.js:357-375` doesn't match the excerpt.
- `npm run db:push` fails against the local database.
- The Step 4 endpoint test can't produce a 429 after two fix attempts (keying/IP extraction may differ from assumptions — report what `req.ip` resolves to in the test).
- Plan 002 landed first and bumped `express-rate-limit` to a version whose Store API differs.

## Maintenance notes

- Each rate-limited request now costs one Postgres roundtrip (Neon pooled connection). Acceptable for auth + crawl endpoints; if rate limiting is ever added to hot read endpoints, revisit with Redis/Upstash instead — the store interface makes that a drop-in swap.
- The fail-open behavior means a DB outage disables rate limiting rather than blocking logins — reviewers should confirm they want that tradeoff.
- The `RateLimitEntry` table self-cleans opportunistically; if it ever grows large, add a scheduled cleanup (Vercel cron) — same mechanism the scheduled-crawls feature needs anyway.
- Follow-up finding to track separately: verify `app.set("trust proxy", ...)` is configured correctly for Vercel so `req.ip` is the real client IP, not the proxy.
