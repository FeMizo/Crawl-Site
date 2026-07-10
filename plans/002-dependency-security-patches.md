# Plan 002: Patch high-severity dependency vulnerabilities (non-breaking only)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d0d0d2a..HEAD -- package.json package-lock.json`
> If these files changed since this plan was written, re-run `npm audit --omit=dev`
> and compare against the "Current state" list before proceeding; if the advisory
> set is materially different, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `d0d0d2a`, 2026-07-09

## Why this matters

`npm audit --omit=dev` reports 15 vulnerabilities (8 high, 7 moderate) in production dependencies. The ones that matter most are on directly reachable code: **nodemailer ≤9.0.0** (4 high advisories incl. CRLF header injection and SSRF in message handling — this app uses nodemailer to send password-reset and email-verification mail from `src/server.js`), **defu** (prototype pollution, high), **tmp** (path traversal, high), and **path-to-regexp** (ReDoS, high). Most of these have non-breaking fixes via `npm audit fix`. The Next.js advisories are only fully fixed in Next 16 (a breaking major) and are explicitly out of scope here.

## Current state

- `package.json` — relevant pins: `next: ^14.2.25`, `nodemailer: ^8.0.5`, `stripe: ^22.0.1`, `@prisma/client: ^6.19.2`, `exceljs: ^4.4.0`, `react: ^18.3.1`.
- `package-lock.json` — already shows as locally modified in git (`M package-lock.json` before this plan starts); note that in your report but proceed.
- Advisory summary from `npm audit --omit=dev` at planning time:
  - **nodemailer ≤9.0.0** — HIGH ×4 (CRLF injection in List-* headers; jsonTransport bypass; TLS validation in OAuth2; raw-option file read/SSRF). Fix available via `npm audit fix`.
  - **defu ≤6.1.4** — HIGH, prototype pollution. Fix via `npm audit fix`.
  - **tmp <0.2.6** — HIGH, path traversal. Fix via `npm audit fix`.
  - **path-to-regexp <0.1.13** — HIGH, ReDoS (transitive under express). Fix via `npm audit fix`.
  - **effect <3.20.0** (transitive under prisma) — HIGH. Fix via `npm audit fix`.
  - **brace-expansion** — MODERATE. Fix via `npm audit fix`.
  - **uuid <11.1.1** (transitive under exceljs) — MODERATE. Fix requires `--force` downgrading exceljs to 3.4.0 (breaking) — DO NOT apply; record as accepted residual.
  - **next 14.2.x** — HIGH ×14 (DoS, cache poisoning, XSS variants). Fix requires next@16 (breaking) — DO NOT apply; record as accepted residual for a separate migration plan.
- Email-sending code that exercises nodemailer: `src/server.js` around lines 72–99 (`createAndSendVerificationToken`, `sendVerificationEmail`) and the forgot/reset-password handlers (`src/server.js:2788, 2829`).
- Tests: `npm test` runs jest in band; `tests/auth.test.js` exercises register/forgot-password/reset-password paths (which call the mailer code with SMTP unconfigured — it warns and continues).

## Commands you will need

| Purpose        | Command                                | Expected on success |
|----------------|----------------------------------------|---------------------|
| Audit (before) | `npm audit --omit=dev`                 | lists the advisories above |
| Apply fixes    | `npm audit fix`                        | exit 0, no `--force` prompts applied |
| Audit (after)  | `npm audit --omit=dev`                 | nodemailer/defu/tmp/path-to-regexp/effect/brace-expansion gone; only next + exceljs/uuid remain |
| Tests          | `npm test`                             | all pass            |
| Build          | `npm run build`                        | exit 0              |

Tests require a running local database (`npm run db:up`) and `.env.local`.

## Scope

**In scope** (the only files you should modify):
- `package.json`
- `package-lock.json`

**Out of scope** (do NOT touch):
- Any source file. If `npm audit fix` bumps a package whose API changed and code breaks, that is a STOP condition, not an invitation to patch code.
- `npm audit fix --force` — never. It would install next@16 and exceljs@3.4.0, both breaking.
- Upgrading Next.js — separate future plan.
- devDependencies advisories — cosmetic here; ignore.

## Git workflow

- Branch: `advisor/002-dependency-security-patches`
- Commit message style: gitmoji + short description, e.g. `:shield: Patch high-severity dependency advisories (npm audit fix)`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Baseline

Run `npm audit --omit=dev` and save the output. Run `npm test` to confirm the suite is green BEFORE changes.

**Verify**: `npm test` → all pass. If not, STOP (pre-existing breakage).

### Step 2: Apply non-breaking fixes

Run `npm audit fix` (WITHOUT `--force`).

**Verify**: `git diff package.json` → any changed version ranges are semver-compatible bumps only (no major-version changes to `next`, `exceljs`, `react`, `stripe`, `prisma`, `@prisma/client`). `nodemailer` moving from `^8.0.5` to a `>=9.0.1` range is EXPECTED and acceptable — nodemailer 9 is a drop-in for the `createTransport`/`sendMail` API this repo uses; anything beyond nodemailer 9.x is a STOP.

### Step 3: Confirm the advisory set shrank

Run `npm audit --omit=dev` again.

**Verify**: nodemailer, defu, tmp, path-to-regexp, effect, and brace-expansion advisories are GONE. Remaining advisories must be only: the Next.js cluster (requires next@16) and uuid-via-exceljs (requires breaking exceljs downgrade). Record both in your final report as accepted residuals.

### Step 4: Regression

**Verify**: `npm test` → all pass (auth tests exercise the mailer code paths). Then `npm run build` → exit 0.

## Test plan

No new tests — this plan changes only dependency versions. The existing suites (`tests/auth.test.js` covering register/forgot/reset flows that touch nodemailer, `tests/stripe.test.js`, `tests/crawl-analysis.test.js`) are the regression gate.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm audit --omit=dev` no longer lists nodemailer, defu, tmp, path-to-regexp, effect, or brace-expansion
- [ ] `git diff package.json` shows no major-version change except nodemailer 8→9
- [ ] `npm test` exits 0
- [ ] `npm run build` exits 0
- [ ] `git status` shows only `package.json`, `package-lock.json`, `plans/README.md` modified
- [ ] `plans/README.md` status row updated, with the two accepted residuals (next@14, exceljs/uuid) noted in its Dependency notes

## STOP conditions

Stop and report back (do not improvise) if:

- `npm audit fix` changes a major version of anything other than nodemailer.
- Any test that passed in Step 1 fails after Step 2.
- `npm run build` fails after the fix.
- The pre-existing local modification to `package-lock.json` conflicts with the fix (e.g. `npm audit fix` refuses to run) — report; do not discard the user's lockfile changes.

## Maintenance notes

- **Accepted residuals to schedule separately**: (1) Next.js 14 → the advisory cluster needs a major upgrade; that migration must be its own plan with the hybrid Pages/App Router surface regression-tested. (2) exceljs pins a vulnerable uuid; watch for an exceljs release that bumps it — the vulnerable path (v3/v5/v6 with caller-provided buffer) is unlikely to be reachable from report generation, which is why it's acceptable.
- Add `npm audit --omit=dev` to any future CI workflow so this doesn't silently regress.
