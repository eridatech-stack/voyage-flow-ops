# InTravelSync (voyage-flow-ops): instructions for AI agents and new contributors

Travel agency operations console: tours, transfers, one-time trips, customers, fleet and drivers, accounting, calendar dashboard, vouchers, email reminders. TanStack Start + React 19 + Drizzle ORM + MySQL 8.

## Read in this order

1. This file (the rules that cause the most breakage).
2. `docs/DEVELOPMENT.md`: the full guide (architecture, data model, domain behaviour, recipes, known gaps, troubleshooting log). Section numbers below refer to it.
3. The matching skill in `.claude/skills/` for the task at hand:

| Task | Skill |
|---|---|
| Starting any task, orientation | `intravelsync-project-guide` |
| New field, route, module, server function, currency | `intravelsync-add-feature` |
| Schema change, migration, data repair script | `intravelsync-database-changes` |
| Bookings, payments, accounting, vouchers, emails | `intravelsync-bookings-accounting` |
| Something is broken | `intravelsync-troubleshooting` |
| Committing, pushing, pull conflicts, tokens | `intravelsync-git-workflow` |

## Rules that cause the most breakage

1. Server functions live in `src/fns/`. Never create a folder named `server` (import protection blocks it). Guide 5.1.
2. Every server function uses `createServerFn(...).inputValidator(zod).handler(...)`; hooks call `fn({ data })`. Plain `"use server"` modules do not work here. Guide 5.2.
3. Normalize database values in the server function (`src/lib/normalize.ts`): dates, times, decimals. Never `String(date)`. Guide 5.4.
4. Do not hand-edit `src/routeTree.gen.ts`; run `npm run dev` after adding route files and commit the regenerated file. Guide 5.5.
5. MySQL identifiers max 64 characters; name long foreign keys explicitly. Guide 5.6.
6. Money is rendered with `useCurrency().format()`; never hardcode a currency symbol.
7. Every booking creates a customer row and an accounting entry; payment status lives in two places and must be kept in sync. Guide 7.1 and 7.2.
8. Run `npx tsc --noEmit` before every commit. It must report zero errors. There are no automated tests.
9. Do not add `tanstackStart`, `react`, `tailwind`, `tsconfigPaths` or `nitro` plugins to `vite.config.ts`; the Lovable config already includes them.

## Security state (read before exposing the app)

Not production-ready. Server functions are unauthenticated and some secret defaults are hardcoded in code (`.env` itself is now untracked, but old values remain in git history). Full list: guide section 11. Never paste or commit tokens or passwords; never print the contents of `.env`.

## Keeping docs true

When you change behaviour, update `docs/DEVELOPMENT.md` and the relevant skill in the same commit. If you find the docs wrong, fix them and say what you changed. Mark anything you did not verify as unverified.
