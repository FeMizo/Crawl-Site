# Plan 004: Make the existing test suite green on a clean database

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat f94b112..HEAD -- tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `f94b112`, 2026-07-10

## Why this matters

`npm test` currently fails with 39 pre-existing failures on a clean environment, which makes the suite useless as a regression gate — any future change (e.g. the planned rate-limiting work) can't be validated against it. Two independent causes, both in test setup, not in production code: (1) `tests/auth.test.js` creates users directly via Prisma without `emailVerified: true`, and the login endpoint rejects unverified users, so every login-dependent test gets 403 instead of a session; (2) `tests/stripe.test.js` webhook tests hit `POST /api/stripe/webhook`, which returns `501 Stripe not configured` when `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` env vars are absent — they are Production-only in Vercel, so a development `vercel env pull` doesn't include them. Stripe is fully jest-mocked in that suite, so dummy values suffice.

## Current state

- `tests/auth.test.js` — auth/role integration tests; 24 of 39 fail. Its user factory at lines 54–64:

```js
async function createUser(email, role = USER_ROLE.USER) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.create({
    data: {
      email,
      name: email.split("@")[0],
      passwordHash,
      role: role.toUpperCase(),
    },
  });
}
```

- The login gate that rejects these users, `src/server.js:2771-2773` (do NOT modify):

```js
    if (!user.emailVerified) {
      return res.status(403).json({ error: "EMAIL_NOT_VERIFIED" });
    }
```

- The User model defaults `emailVerified` to `false` (`prisma/schema.prisma:20`). No test in `tests/auth.test.js` asserts the EMAIL_NOT_VERIFIED path (verified by grep), so setting the flag in the factory breaks nothing.
- The working example: `tests/site-info.test.js:38-48` creates its user WITH `emailVerified: true` and its login-dependent tests pass.

- `tests/stripe.test.js` — Stripe is jest-mocked at lines 42+ (`jest.mock("stripe", ...)`), so no real API is ever called. The env bootstrap is at lines 1–20 (`loadEnvConfig` + `applyEnvFile(".env.local")`), then `const app = require("../src/server")` at line 28. The webhook handler guard, `src/server.js:180-183` (do NOT modify):

```js
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(501).json({ error: "Stripe not configured" });
  }
  ...
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

The Stripe client is constructed per-request from env (also `src/server.js:582-583`), so setting env vars in the test file before requests are made is sufficient.

- Repo conventions: tests use jest + supertest against `require("../src/server")` with a real Postgres from `.env.local`; unique throwaway emails per run; cleanup in `afterAll`.

## Commands you will need

| Purpose    | Command                            | Expected on success |
|------------|------------------------------------|---------------------|
| Auth suite | `npm test -- tests/auth.test.js`   | all pass            |
| Stripe     | `npm test -- tests/stripe.test.js` | all pass            |
| Full suite | `npm test`                         | all suites pass     |

Requires `.env.local` with `dashboard_DATABASE_URL` (present in the main repo).

## Scope

**In scope** (the only files you should modify):
- `tests/auth.test.js`
- `tests/stripe.test.js`

**Out of scope** (do NOT touch):
- `src/server.js` — both gates (email verification, Stripe 501) are correct production behavior; the tests must adapt, not the server.
- `prisma/schema.prisma` — the `emailVerified` default is correct.
- `tests/site-info.test.js`, `tests/crawl-analysis.test.js` — already green.
- `.env.local`, `.env.example` — no env file edits; dummy Stripe values are set in test code only.

## Git workflow

- Branch: `advisor/004-green-test-baseline`
- Commit style: gitmoji + short description, e.g. `:white_check_mark: Fix pre-existing test failures (emailVerified, Stripe env)`
- Do NOT push or open a PR.
- Commit ONLY the two test files.

## Steps

### Step 1: Fix the auth user factory

In `tests/auth.test.js` `createUser()` (lines 54–64), add `emailVerified: true,` to the `data` object.

**Verify**: `npm test -- tests/auth.test.js` → expect a large improvement. If ANY tests still fail, read each failure: if it's caused by something other than login/session (e.g. an assertion that was always wrong), record it verbatim and continue to Step 2 — final judgment happens in Step 3.

### Step 2: Provide dummy Stripe env in the stripe suite

In `tests/stripe.test.js`, immediately after `applyEnvFile(".env.local");` (line 20) and BEFORE `const app = require("../src/server")`, add:

```js
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_for_jest";
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_dummy_for_jest";
```

(`||` fallback so a real local value, if someone has one, still wins.) Also add `emailVerified: true` to any direct `prisma.user.create` in this file if present (check its user factory — same 403 failure mode as auth).

**Verify**: `npm test -- tests/stripe.test.js` → all pass. If webhook tests now fail differently (e.g. signature verification errors instead of 501), read how the suite mocks `constructEvent` (line ~64 and ~262) — the mock should bypass real signature checks; if it doesn't and tests still fail, STOP and report the exact failure.

### Step 3: Full suite

**Verify**: `npm test` → ALL suites pass (auth, stripe, crawl-analysis, site-info). If a handful of failures remain that are genuine pre-existing assertion bugs unrelated to the two root causes above, STOP and report them verbatim rather than patching assertions to match behavior — changing what a test asserts requires reviewer judgment.

## Test plan

No new tests — this plan repairs existing ones. The done criterion IS the full suite passing.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm test` exits 0 — all 4 suites pass
- [ ] `grep -n "emailVerified: true" tests/auth.test.js` → ≥1 match
- [ ] `grep -n "STRIPE_WEBHOOK_SECRET" tests/stripe.test.js` → ≥1 match
- [ ] `git status` shows only the two in-scope test files modified
- [ ] `plans/README.md` status row updated (unless reviewer maintains the index)

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts above don't match the live code (drift).
- After both fixes, more than 3 tests still fail — the diagnosis is incomplete; report the failures verbatim.
- Fixing a failure would require changing what a test ASSERTS (not its setup) — reviewer judgment needed.
- Fixing a failure would require touching `src/server.js` or any out-of-scope file.

## Maintenance notes

- Any future test that logs in must create its user with `emailVerified: true` — consider extracting a shared `tests/helpers.js` factory later (deliberately out of scope here to keep the diff minimal).
- The dummy Stripe env values are safe because the suite mocks the `stripe` package entirely; if the mock is ever removed, these tests must move to Stripe test-mode keys instead.
- CI (when added) should run `npm test` against a disposable database, not production Neon — this plan keeps the existing convention but doesn't endorse it long-term.
