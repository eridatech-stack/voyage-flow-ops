---
name: intravelsync-project-guide
description: Orientation for the InTravelSync (voyage-flow-ops) codebase. Use at the start of any task in this repository. Explains the stack, request flow, directory map, non-negotiable conventions and which other InTravelSync skill to load next.
---

# InTravelSync project guide

Full reference: `docs/DEVELOPMENT.md`. This skill is the short version for starting work.

## Stack in one line

TanStack Start + Router (SSR, file routes, server functions), React 19, Tailwind v4, shadcn/ui, TanStack Query, Drizzle ORM on MySQL 8 (`mysql2`), Zod, JWT via `jose` + `bcryptjs`, Resend for email. Dev server: `http://localhost:8080`.

## Request flow

```
component -> hook (src/hooks/useX.ts) -> server function (src/fns/*.ts) -> Drizzle (src/db) -> MySQL
```

## Where things are

- `src/db/schema.ts`: all 14 tables and relations. `client.ts`: pool. `seed.ts`: first admin and settings.
- `src/fns/auth.ts`, `tours.ts`, `data.ts`: every server function (the API).
- `src/hooks/`: one React Query hook file per domain; types derive from server return types.
- `src/routes/`: file-based routes. `routeTree.gen.ts` is generated.
- `src/lib/normalize.ts`, `src/lib/auth/jwt.ts`: shared helpers.
- `src/components/AppSidebar.tsx`: navigation items.

## Domain model in one paragraph

Tours and transfers have three layers (catalog, dated schedule, customer bookings). Trips are flat (trip, bookings). Every booking creates a `customers` row and an `accounting_entries` row. Settings hold the agency currency, which drives all money formatting.

## Before you change anything

1. Read the rules in `AGENTS.md`. They are the mistakes already made once.
2. Pick the matching skill: `intravelsync-add-feature`, `intravelsync-database-changes`, `intravelsync-bookings-accounting`, `intravelsync-troubleshooting`, `intravelsync-git-workflow`.
3. Check guide section 11 (known gaps) so you do not rediscover a documented problem or build on a known-broken part (for example, authentication is not enforced on server functions).

## Done means

- `npx tsc --noEmit` reports zero errors.
- If a route file was added or renamed, `npm run dev` was run and the regenerated `src/routeTree.gen.ts` is committed.
- If the schema changed, `npm run db:push` was run and the change is described in the commit.
- Docs and the relevant skill updated if behaviour changed.
- Anything not actually run or verified is stated as unverified in your summary.
