# Plan 005: Key rate limiting on the real client IP behind Vercel's proxy

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 692f3a9..HEAD -- src/server.js tests/rate-limit.test.js`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED (a wrong trust-proxy setting can make rate limiting spoofable — read "Why this matters" carefully)
- **Depends on**: 003 (the rate limiter this corrects) — DONE
- **Category**: security
- **Planned at**: commit `692f3a9`, 2026-07-10

## Why this matters

Plan 003 gave the app a working shared rate-limit store, but the limiter keys on `req.ip`, and `req.ip` is wrong in this deployment. The Express app (`src/server.js`) is invoked directly by a Next.js API handler (`lib/server/express-next-handler.*` calls `expressApp(req, res)`) and runs on Vercel serverless. Express's `req.ip` derives from `trust proxy`, which is currently unset (`grep "trust proxy" src/server.js` → no match). With it unset, `req.ip` is the socket peer — Vercel's internal proxy address — not the client. So every request appears to come from a handful of Vercel edge IPs: the auth brute-force limiter (20 failed logins / 15 min) would lump all users together and could lock out legitimate traffic, while offering an attacker little friction.

The naïve fix — `app.set("trust proxy", true)` — is itself a vulnerability for a *rate limiter*: it makes Express trust the entire `X-Forwarded-For` header, which the client controls, so an attacker rotates that header per request and bypasses the limit entirely. The correct fix must derive the client IP from a source the client cannot forge. On Vercel, that is not "trust the whole XFF chain."

This plan is scoped small but is security-sensitive; its verification cannot be fully proven in a local test (there is no Vercel proxy locally), so it includes an explicit deploy-time verification step the human must complete.

## Current state

- `src/server.js:158` — `const app = express();` immediately followed by Prisma setup. No `app.set("trust proxy", ...)` anywhere.
- `src/server.js:345-348` — middleware chain: `express.json()`, `cookieParser()`, `express.static(...)`, `helmet()`.
- `src/server.js:357-377` — the two `rateLimit({...})` limiters from plan 003, each with a `store: new PrismaRateLimitStore(...)`. Neither sets a `keyGenerator`, so express-rate-limit v6 uses its default, which is `req.ip`.
- `lib/server/express-next-handler.*` — thin wrapper: `export default (req,res) => expressApp(req,res)`. Confirms Express receives the raw Node req/res from Vercel; there is no intermediate Express `.listen()`.
- Observed during plan 003 testing: setting `X-Forwarded-For` in a request made express-rate-limit throw `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` — its built-in guard warning that XFF is present while `trust proxy` is unset. This confirms the misconfiguration concretely.
- Vercel populates the client IP in the `x-forwarded-for` header; the platform also sets `x-real-ip` and `x-vercel-forwarded-for`. On Vercel's infrastructure the CLIENT is the LEFTMOST entry of `x-forwarded-for`, and Vercel appends its own hop(s) to the right. The number of Vercel-controlled trailing hops is what determines a correct `trust proxy` hop count.

Repo conventions: CommonJS (`require`), Spanish user-facing errors, tests in `tests/` via jest+supertest against `require("../src/server")` with `.env.local` Postgres.

## Recommended approach (the executor should implement Option A unless STOPped)

**Option A — trust a fixed number of proxy hops (preferred).** Set `app.set("trust proxy", 1)` once, right after `const app = express();` (line 158). `trust proxy` = 1 tells Express to trust exactly one hop — take the IP one position from the right of `X-Forwarded-For`. This resists client spoofing (a forged leftmost entry is ignored; Express reads from the right) while still resolving to the real client when Vercel adds exactly one hop.

The risk: if Vercel adds MORE than one hop in front of the app, `1` yields a Vercel-internal IP, not the client — safe (fails toward over-grouping) but not accurate. If it adds ZERO hops in some path, `1` could read a client-forged value — unsafe. The exact hop count cannot be determined locally; it MUST be confirmed in a real Vercel deployment (Step 4). Start with `1`; Step 4 tells the human how to confirm or adjust.

Do NOT use `trust proxy: true` (trusts the whole chain — spoofable). Do NOT implement a custom `keyGenerator` that reads the leftmost XFF entry (also spoofable).

## Commands you will need

| Purpose    | Command                                | Expected |
|------------|----------------------------------------|----------|
| Load check | `node -e "require('./src/server')"`    | exit 0   |
| Rate tests | `npm test -- tests/rate-limit.test.js` | all pass |
| Full tests | `npm test`                             | all suites pass |
| Build      | `npm run build`                        | exit 0   |

Requires `.env.local` with `dashboard_DATABASE_URL`.

## Scope

**In scope** (the only files you may modify):
- `src/server.js` — add exactly ONE line: `app.set("trust proxy", 1);` after line 158.
- `tests/rate-limit.test.js` — adjust ONLY if the existing 429 integration test now behaves differently because of the trust-proxy change (see Step 3). Prefer not to touch it.

**Out of scope** (do NOT touch):
- The limiter option objects, windows, maxes, the store — plan 003 territory, unchanged.
- Any custom `keyGenerator` — not part of the preferred approach.
- `helmet`/`cors`/other middleware.
- `vercel.json`.

## Git workflow

- Branch: `advisor/005-trust-proxy-client-ip`
- Commit: `:shield: Trust one proxy hop so rate limiting keys on real client IP`
- Commit only `src/server.js` (and `tests/rate-limit.test.js` only if Step 3 required it). Do NOT push. Do NOT commit `.env.local`/`package-lock.json`.

## Steps

### Step 1: Set trust proxy

In `src/server.js`, immediately after `const app = express();` (line 158), add:

```js
app.set("trust proxy", 1); // Vercel places the client IP in X-Forwarded-For; trust exactly one hop so the rate limiter keys on the real client, not the edge, without trusting a client-spoofable full chain.
```

**Verify**: `node -e "require('./src/server')"` → exit 0.

### Step 2: Confirm the express-rate-limit XFF guard is satisfied

**Verify**: `npm test -- tests/rate-limit.test.js` → all pass. In particular the 21st-login-429 test must still reach 429. With `trust proxy` set, express-rate-limit will no longer emit `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` if a test sets `X-Forwarded-For`.

### Step 3: If (and only if) the 429 test broke

The plan-003 429 test may have removed `X-Forwarded-For` (because it previously errored). With `trust proxy: 1`, supertest requests from the same loopback still share a key, so the test should still reach 429 without any XFF header — DO NOTHING if it passes. If it now fails because requests are keyed differently, the minimal fix is to give each of the 21 requests the SAME `X-Forwarded-For: 203.0.113.10` so they share a key; add that header to the loop. Do not otherwise alter the test's assertions.

**Verify**: `npm test -- tests/rate-limit.test.js` → all pass.

### Step 4: Full regression + write the deploy-verification note

**Verify**: `npm test` → all suites pass. `npm run build` → exit 0.

Then, in your report's NOTES, include this verbatim for the human to execute post-deploy (it cannot be verified locally):

> DEPLOY-TIME VERIFICATION (human, on a Vercel preview/prod deploy):
> 1. Add a temporary debug log or use an existing authenticated endpoint to print `req.ip` for a request you make from a known external IP (e.g. your laptop's public IP from `curl ifconfig.me`).
> 2. Confirm `req.ip` equals YOUR public IP, not a `10.x`/`100.x`/Vercel-internal address and not a value you can change by sending your own `X-Forwarded-For`.
> 3. Test spoofing: send `curl -H "X-Forwarded-For: 1.2.3.4" https://<deploy>/<endpoint>` and confirm `req.ip` is NOT `1.2.3.4` (proves the leftmost entry isn't trusted).
> 4. If `req.ip` is a Vercel-internal IP → increase the hop count (`trust proxy` 2). If it equals a value you injected → the setting trusts too much; STOP and reassess (do not raise the count). Re-deploy and re-check.

## Test plan

No new automated tests — trust-proxy resolution depends on the real proxy and cannot be unit-tested meaningfully. The existing plan-003 rate-limit tests are the local regression gate; Step 4's manual procedure is the real verification.

## Done criteria

Machine-checkable (local):

- [ ] `grep -n 'trust proxy' src/server.js` → exactly 1 match, value `1`
- [ ] `npm test` exits 0 (all suites)
- [ ] `npm run build` exits 0
- [ ] `git status` shows only `src/server.js` modified (and `tests/rate-limit.test.js` only if Step 3 required)
- [ ] Report NOTES contains the deploy-time verification procedure
- [ ] `plans/README.md` status row updated (unless reviewer maintains index)

## STOP conditions

Stop and report back (do not improvise) if:

- `const app = express();` is not at `src/server.js:158` or the limiter code has drifted from plan 003's shape.
- Setting `trust proxy: 1` makes any plan-003 rate-limit test fail in a way Step 3's same-XFF fix doesn't resolve.
- You conclude the correct hop count is anything other than 1 based on evidence in the repo (document the evidence; the human confirms on deploy).
- The change appears to require a custom `keyGenerator` or touching the limiter options — that's a larger redesign; report instead of improvising.

## Maintenance notes

- The `trust proxy` value is coupled to Vercel's proxy topology; if the deployment platform changes (or Vercel changes hop count), revisit. The Step 4 procedure is the re-check.
- A future hardening: derive the key from `x-real-ip` or `x-vercel-forwarded-for` (platform-set, harder to spoof) via a custom `keyGenerator`, instead of relying on hop counting. Deferred here to keep the change one line and reversible.
- Reviewer should scrutinize: is the hop count justified, and is the deploy-verification actually performed before this is trusted in production? Until Step 4 is done, treat rate-limit keying as "improved but unverified."
