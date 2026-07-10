---
name: new-module
description: Scaffold a new App Router module (page, API routes, data layer, auth, access guards, types, components) following this repo's standard architecture. Use when creating a new dashboard module or feature area.
---

# New App Router Module

All new modules live in the App Router (`app/`), never the Pages Router. Full reference: `docs/app-router-architecture.md`. Use the roadmap and CMS modules as working examples.

## File layout to create

```text
app/dashboard/<module>/page.tsx       # Page (server component wrapper + client component)
app/api/<module>/**/route.ts          # API endpoints
lib/<module>-data.ts                  # Business logic / Prisma queries
lib/<module>-auth.ts                  # JWT validation (auth_token cookie)
lib/server/<module>-access.ts         # Route guards (viewer/editor)
types/<module>.ts                     # DTOs and types
components/<module>/                  # UI components
```

## API route requirements (every `route.ts`)

1. `export const runtime = "nodejs"`
2. Wrap every handler with `runPrismaRoute(...)` from `lib/server/prisma-route.ts` — it provides the JSON response shape, Prisma error mapping (P2025 → 404, P2002 → 409), and removes per-route try/catch.
3. Throw domain errors with `routeError(status, message)` — never return ad-hoc error JSON.
4. Validate auth via the module's `lib/<module>-auth.ts` before touching data.

## Access control

- Roles come from `lib/user-roles.js`: OWNER, SUPER_ADMIN, ADMIN, EDITOR, USER.
- Read paths gate on viewer access; mutations gate on editor access, both in `lib/server/<module>-access.ts`.

## UI rules

- Dark-first, Manrope + Syne, dense layout. Reuse existing components before creating new ones.
- Minimum font size 13px. Keep emojis/icons in labels.
- Hierarchy via typography first, color second.

## Validation before finishing

- `npx tsc --noEmit` passes
- `npm run build` passes
- If DB schema changed: `npm run db:push` applied and Prisma client regenerated
