---
name: intravelsync-troubleshooting
description: Diagnosis playbook and symptom-to-fix table for InTravelSync errors seen so far, including SSR crashes, import-protection errors, db:push failures, date bugs, missing routes and stale accounting data. Use when the app, build, type check or database command fails.
---

# Troubleshooting InTravelSync

Full log: `docs/DEVELOPMENT.md` section 13.

## Diagnose in this order

1. Read the terminal running `npm run dev`. A browser page saying "This page didn't load" or `h3 swallowed SSR error` hides the real cause; the terminal has it.
2. Run `npx tsc --noEmit`. Zero errors is the baseline. (If it complains about missing `vite/client` or modules, run `npm install` first.)
3. Check `src/routeTree.gen.ts` includes any route you just added.
4. Check `.env` exists with the variables in `.env.example`, and MySQL is running.
5. Reproduce with a minimal action and read the first error in the stack, not the last.

## Symptom, cause, fix

| Symptom | Cause | Fix |
|---|---|---|
| `[import-protection] Import denied in client environment ... **/server/**` | A folder named `server` | Server functions live in `src/fns/` |
| `ER_TOO_LONG_IDENT` in `db:push` | Auto FK name over 64 chars | Name the FK explicitly (see `intravelsync-database-changes`) |
| `Incorrect date value: 'Wed Oct 14'` | `String(Date)` written to a date column | `normalizeDate` or `toISOString().slice(0,10)` |
| Calendar shows events one day early | `toISOString()` on a local `Date` in UTC+4 | `localDateStr()` |
| Login: `Cannot read properties of null (reading 'auth')` | Leftover Supabase code calling a null client | Remove the call; auth is JWT now |
| `ERR_MODULE_NOT_FOUND '@supabase/supabase-js'` | Package removed, file still imports it | Delete the import. `client.ts` and `client.server.ts` are null stubs and `types.ts` is unused; `auth-attacher.ts` and `auth-middleware.ts` in the same folder are live JWT code, do not delete them |
| New route 404s or crashes | `routeTree.gen.ts` not regenerated | `npm run dev`, commit the regenerated file |
| Accounting still Pending after marking Paid | Status in two tables, one edit path did not sync | See `intravelsync-bookings-accounting` |
| Accounting summary cards not refreshing | Only `accounting` was invalidated | Also invalidate `accounting_summary` |
| Schedule shows `3 / 16` for a 4-seat departure | Old rows saved with a default capacity | Edit the schedule and save with the right capacity |
| Hook crash: variable not defined in a child component | Hook result used in a component that did not call the hook | Call the hook in the component that uses it |
| `Failed query ... params: ...` from Drizzle | Wrong value shape sent to MySQL | Read the `cause` line: it holds the MySQL error text |
| Reminder emails fail | No Resend key in Settings, or testing sender restriction | Settings, Email Configuration; see emails section in `intravelsync-bookings-accounting` |
| `git pull` refused | Local changes to `package-lock.json` or `routeTree.gen.ts` | See `intravelsync-git-workflow` |

## If it is not in the table

Fix the cause, then add a row to guide section 13 and to this table in the same commit.
