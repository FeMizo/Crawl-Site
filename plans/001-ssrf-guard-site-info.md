# Plan 001: Guard /api/site-info against SSRF with ensureUrlAllowed

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d0d0d2a..HEAD -- src/server.js tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `d0d0d2a`, 2026-07-09

## Why this matters

`GET /api/site-info` fetches a user-supplied URL server-side without validating it. Every other URL-fetching entry point in this codebase (`POST /api/projects`, `GET /api/crawl`) first calls `ensureUrlAllowed()`, which rejects localhost and private IP ranges. Because site-info skips that check, any authenticated user can make the server issue HTTP requests to internal addresses (cloud metadata endpoints, internal services) and read the response — a server-side request forgery hole. The fix is to apply the exact same guard the sibling endpoints already use.

## Current state

- `src/server.js` — a single Express app that implements all Pages Router API endpoints. It is mounted into Next.js via `lib/server/express-next-handler` and deployed as Vercel serverless functions. Do not restructure it; this plan adds 2 lines plus tests.

The vulnerable handler, `src/server.js:3766-3776`:

```js
//  API: Site info
app.get("/api/site-info", requireAuth, async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "URL requerida" });
  try {
    const info = await fetchSiteInfo(url);
    res.json(info);
  } catch (e) {
    res.json({ error: e.message });
  }
});
```

The existing guard, `src/server.js:2590-2611` (do NOT modify it):

```js
async function ensureUrlAllowed(rawUrl) {
  if (!rawUrl) return false;
  let hostname;
  try {
    hostname = new URL(rawUrl).hostname;
  } catch {
    return false;
  }
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower === "127.0.0.1" || lower === "::1")
    return false;
  // quick IP literal check
  if (/^\d+\.\d+\.\d+\.\d+$/.test(lower) && isIpPrivateRange(lower))
    return false;
  try {
    const r = await dns.lookup(hostname).catch(() => null);
    if (r && r.address && isIpPrivateRange(r.address)) return false;
  } catch {
    // ignore lookup errors, allow conservative behavior
  }
  return true;
}
```

The pattern to copy — how `POST /api/projects` uses the guard, `src/server.js:3262-3263`:

```js
    const allowed = await ensureUrlAllowed(targetUrl);
    if (!allowed) return res.status(400).json({ error: "URL no permitida" });
```

Repo conventions that apply:
- Error messages in user-facing API responses are in Spanish. Use the exact string `"URL no permitida"` to match the sibling endpoints.
- Tests live in `tests/`, use jest + supertest against `const app = require("../src/server")`, and hit a real Postgres database configured via `.env.local` (loaded at the top of each test file — see `tests/auth.test.js:1-29` for the bootstrap pattern).

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Tests     | `npm test -- tests/site-info.test.js` | all pass       |
| Full tests| `npm test`                       | all pass            |
| Build     | `npm run build`                  | exit 0              |

Tests require a running local database: `npm run db:up` first if Docker Postgres isn't already running, and a populated `.env.local`.

## Scope

**In scope** (the only files you should modify):
- `src/server.js` — only the `/api/site-info` handler (~line 3767)
- `tests/site-info.test.js` (create)

**Out of scope** (do NOT touch, even though they look related):
- `ensureUrlAllowed()` itself — hardening it (IPv6 literals, DNS rebinding) is a separate concern; changing it here risks breaking the crawl and project endpoints.
- `fetchSiteInfo()` (`src/server.js:1913`) — no changes to what it fetches or returns.
- `pages/api/site-info.js` — it only re-exports the shared handler; nothing to change.
- The error-swallowing `catch (e) { res.json({ error: e.message }) }` shape — leave the response contract as-is.

## Git workflow

- Branch: `advisor/001-ssrf-guard-site-info`
- Commit message style follows the repo (see `git log`): gitmoji prefix + short description, e.g. `:shield: Guard /api/site-info with ensureUrlAllowed`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the guard to the handler

In `src/server.js`, inside the `/api/site-info` handler, after the `if (!url)` check and before the `try` block, insert:

```js
  const allowed = await ensureUrlAllowed(url);
  if (!allowed) return res.status(400).json({ error: "URL no permitida" });
```

The resulting handler must read: missing-url check → allowed check → try/fetchSiteInfo.

**Verify**: `node -e "require('./src/server')" ` → exits 0 (no syntax error; the module may log env warnings — that's fine).

### Step 2: Write tests

Create `tests/site-info.test.js`. Copy the env-bootstrap block from `tests/auth.test.js:1-29` verbatim (loadEnvConfig + applyEnvFile + `const app = require("../src/server")`). Create one test user via Prisma with a bcrypt-hashed password and log in via `POST /api/auth/login` with supertest to obtain the `auth_token` cookie (follow the login helper pattern in `tests/auth.test.js`). Clean up created users in `afterAll`.

Test cases:
1. `GET /api/site-info?url=http://localhost:3000` with auth cookie → expect status 400 and body `{ error: "URL no permitida" }`.
2. `GET /api/site-info?url=http://127.0.0.1/admin` with auth cookie → expect 400, same body.
3. `GET /api/site-info?url=http://169.254.169.254/latest/meta-data/` with auth cookie → expect 400 (link-local; if this case fails because `isIpPrivateRange` does not cover 169.254.0.0/16, record that in your report as a follow-up finding — do NOT modify `isIpPrivateRange` — and drop this assertion to the private-range case `http://10.0.0.1/`).
4. `GET /api/site-info` with no `url` param → expect 400 `{ error: "URL requerida" }`.
5. `GET /api/site-info?url=https://example.com` with NO auth cookie → expect 401 (confirms requireAuth still applies).

Do NOT write a test that fetches a real external site — no network-dependent assertions.

**Verify**: `npm test -- tests/site-info.test.js` → all tests pass.

### Step 3: Full regression

**Verify**: `npm test` → all suites pass (auth, crawl-analysis, stripe, site-info). Then `npm run build` → exit 0.

## Test plan

Covered by Step 2: private/loopback/link-local rejection, missing-param behavior unchanged, auth still enforced. Model the file structure after `tests/auth.test.js`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "ensureUrlAllowed(url)" src/server.js` shows a match inside the site-info handler (between lines ~3767 and ~3780)
- [ ] `npm test -- tests/site-info.test.js` exits 0 with ≥4 tests passing
- [ ] `npm test` exits 0
- [ ] `npm run build` exits 0
- [ ] `git status` shows only `src/server.js`, `tests/site-info.test.js`, and `plans/README.md` modified/created
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `/api/site-info` handler at ~`src/server.js:3767` does not match the excerpt above.
- `ensureUrlAllowed` no longer exists or its signature changed.
- Tests cannot connect to a database after `npm run db:up` (environment problem — report, don't reconfigure Prisma).
- Any existing test in `npm test` fails BEFORE your change (pre-existing breakage — report it).

## Maintenance notes

- If a future endpoint fetches user-supplied URLs, it must call `ensureUrlAllowed` — reviewers should grep for `fetch`/`http.get` on request-derived URLs.
- Known residual risk, deliberately out of scope here: `ensureUrlAllowed` checks DNS once (rebinding window) and doesn't handle IPv6 literals or 169.254.0.0/16 unless `isIpPrivateRange` covers them. A follow-up hardening plan may address this.
