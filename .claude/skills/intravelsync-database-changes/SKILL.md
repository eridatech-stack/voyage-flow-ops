---
name: intravelsync-database-changes
description: How to change the InTravelSync MySQL schema safely, including editing Drizzle tables, db:push, the 64-character identifier limit, value normalization, transactions and one-off data repair scripts. Use for any schema, migration, seed or data-fix work.
---

# Database changes

Reference: `docs/DEVELOPMENT.md` sections 5.4, 5.6, 6, 11.

## Changing the schema

1. Edit `src/db/schema.ts` (tables, enums, relations). Primary keys are cuid2 strings, `varchar(128)`.
2. `npm run db:push` syncs the schema directly to local MySQL. It can drop data on destructive changes (removed columns, narrowed types). Read what it prints before confirming. For anything beyond local development use `npm run db:generate` and a reviewed migration; the project does not use versioned migrations yet.
3. Add the change to the commit message. The developer pulls and must run `db:push` too.

## The 64-character rule

MySQL identifiers max out at 64 characters. Drizzle names foreign keys `{table}_{column}_{reftable}_{refcolumn}_fk`. Count before adding one:

```
node -e "console.log(['tbl','col','reftable','id'].join('_').length + 3)"
```

If the result is over 64, drop the inline `.references()` and name it with the `foreignKey` helper as a second argument to `mysqlTable`, for example `tb_sched_transfer_fk` on `transfer_bookings`. Symptom when ignored: `ER_TOO_LONG_IDENT` from `db:push`.

## Values coming out and going in

| Column | Read as | Write as |
|---|---|---|
| `date` | `Date` at UTC midnight; use `normalizeDate` | `"YYYY-MM-DD"` string (cast `as any` if Drizzle complains) |
| `time` | `"HH:MM:SS"`; use `normalizeTime` | `"HH:MM"` |
| `decimal` | string; use `normalizeDecimal` | `String(number)` |
| `timestamp` | `Date`; the code uses `String(row.created_at)` | default now |

Never `String(date)` for a date column (gives `"Wed Oct 14 ..."`, MySQL rejects it). Never `toISOString()` on a locally built `Date` to get a calendar day (shifts a day in UTC+4); use `localDateStr()` in the browser.

## Multi-row writes

Booking creation inserts a customer, a booking and an accounting entry as three separate statements with no transaction. Any new multi-insert should use `db.transaction(async (tx) => { ... })`. Retrofitting the existing booking functions is a documented open item (guide 11, item 9).

## One-off data repair scripts

Model on `src/db/fix-accounting-dates.ts`: a standalone `tsx` script that imports `db`, reads rows, computes the correct value, updates only rows that differ, logs each change and a final count, and is safe to re-run. Register it as an npm script (`db:fix-...`). Use a `toYMD(value)` helper for any date comparison. Test on a copy of the data when possible.

## Seed

`npm run db:seed` creates the admin user and default settings. It is not idempotent for settings (random id), so running it twice creates a second settings row. Run once.

## Soft vs hard delete

Tours and transfers are archived (`is_active = false`). Trips and bookings are hard-deleted, and deleting a booking leaves its `accounting_entries` row behind (guide 11, item 8). Decide deliberately before adding delete paths.
