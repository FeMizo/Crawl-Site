# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server on port 3666
npm run build        # Production build
npm run test         # Jest (runs in band, 20s timeout)
npm test -- <file>   # Single test file

npm run db:up        # Start PostgreSQL via Docker Compose
npm run db:push      # Apply Prisma schema changes
npm run db:seed      # Seed database
npx prisma studio    # GUI for database inspection
```

## Architecture

SEO crawler SaaS. Users create projects, run crawls (detecting 404s, missing metadata, redirects, noindex issues), review history, and download Excel reports. Includes internal roadmap and CMS modules.

**Two coexisting routers:**
- **Pages Router** (`pages/`) — legacy: auth, main dashboard, projects, history, settings
- **App Router** (`app/`) — new standard: roadmap, CMS, and any new modules going forward

### Module Structure (App Router standard)

All new modules follow this layout (see `docs/app-router-architecture.md`):

```
app/dashboard/<module>/page.tsx       # Page
app/api/<module>/**/route.ts          # API endpoints
lib/<module>-data.ts                  # Business logic / DB queries
lib/<module>-auth.ts                  # Authentication helpers
lib/server/<module>-access.ts         # Route guards (viewer/editor)
types/<module>.ts                     # DTOs and types
components/<module>/                  # UI components
```

### API Route Conventions

Every `app/api/**/route.ts` must:
- Export `runtime = "nodejs"`
- Wrap handlers with `runPrismaRoute(...)` from `lib/server/prisma-route.ts`
- Throw domain errors with `routeError(status, message)`

`runPrismaRoute` handles: standard JSON response shape, Prisma error mapping (`P2025` → 404, `P2002` → 409), and eliminates per-route try/catch.

### Authentication

JWT stored in `auth_token` cookie. Token validated in each module's `lib/<module>-auth.ts`. Role-based access via `lib/user-roles.js` — roles: `OWNER`, `SUPER_ADMIN`, `ADMIN`, `EDITOR`, `USER`.

### Database

Prisma + PostgreSQL (Neon). Key models: `User`, `Subscription`, `Project`, `CrawlRun`, `CrawlRunPage`, `RoadmapPhase`, `RoadmapTask`.

Subscription plans: `FREE`, `BASIC`, `STARTER`, `PRO`, `AGENCY` — each with crawl and project limits.

## Design System

Dark-first UI. Fonts: Manrope + Syne (established, do not change).

- Green `#00ff88` — brand/success accent
- Blue `#4d8dff` — interactive/primary actions
- Dense information layout — do not over-space
- Hierarchy through typography (size + weight) before color
- Every visual element must help the user find problems faster — remove decoration that doesn't serve data
