# InTravelSync (voyage-flow-ops) — Developer Guide

Operations console for a travel agency: tours, transfers, one-time trips, customers, fleet and drivers, accounting, a calendar dashboard, vouchers and email reminders.

Last updated: 2026-11-12. Everything below was verified against the code in this repository on that date. Where something is unverified or suspected, it says so.

Companion files: `AGENTS.md` (entry point and rules), `.claude/skills/` (task playbooks that point back to the sections below). If you change behaviour, update this guide and the matching skill together.

Contents

1. Current status
2. Quick start (Windows)
3. Stack
4. Architecture
5. Code conventions (read before changing anything)
6. Data model
7. Domain behaviour
8. Authentication
9. Recipes for extending the app
10. Git workflow and environment gotchas
11. Known gaps and hardening checklist
12. Legacy and dead code
13. Troubleshooting log
14. npm scripts

---

## 1. Current status

- Runs locally only: Windows, Node, local MySQL 8.0.x, dev server at http://localhost:8080.
- Migrated from Supabase to MySQL + Drizzle ORM. Supabase is gone from the data layer; a few leftover files still carry the old name (section 12).
- Modules: Dashboard, Tours (3 layers), Transfers (3 layers), Trips (flat), Customers, Fleet and Drivers, Accounting, Settings.
- Not production-ready. Server functions are not authenticated (section 11, item 1). Fix that before exposing the app beyond localhost.

## 2. Quick start (Windows)

Prerequisites: a current Node LTS (Vite 8 needs a recent Node), MySQL 8 running locally, Git.

1. Create the database and a dedicated user (MySQL Workbench or `mysql`). Choose your own password:

   ```sql
   CREATE DATABASE voyage_flow_ops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'vfo_user'@'localhost' IDENTIFIED BY '<choose-a-password>';
   GRANT ALL PRIVILEGES ON voyage_flow_ops.* TO 'vfo_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. Clone and configure:

   ```powershell
   git clone https://github.com/eridatech-stack/voyage-flow-ops.git
   cd voyage-flow-ops
   copy .env.example .env      # then edit .env with your password and a long random JWT_SECRET
   npm install
   ```

3. Create tables and the first user. Run the seed once only (it is not idempotent, see section 11):

   ```powershell
   npm run db:push
   npm run db:seed
   npm run dev
   ```

4. Log in with the account printed by the seed (`admin@intravelsync.com`; the password is in `src/db/seed.ts`). Change it immediately from the sidebar user menu.

Environment variables (`.env.example` lists them): `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `JWT_SECRET`, `VITE_APP_NAME`. Variables prefixed `VITE_` are exposed to the browser; never put secrets in them.

## 3. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | TanStack Start 1.167 + TanStack Router 1.168 | SSR, file-based routes, server functions |
| UI | React 19, Tailwind v4, shadcn/ui (`src/components/ui`) | Lucide icons, sonner toasts |
| Data fetching | TanStack Query 5 | one hook file per domain |
| Database | MySQL 8.0 via `mysql2` | pooled connection (`src/db/client.ts`) |
| ORM | Drizzle ORM 0.45 + drizzle-kit | schema in `src/db/schema.ts` |
| Validation | Zod 3 | every server function validates input |
| Auth | `jose` (JWT, HS256) + `bcryptjs` | token in localStorage |
| IDs | `@paralleldrive/cuid2` | string primary keys, `varchar(128)` |
| Email | Resend REST API | see section 7.6 |
| Build | Vite 8 via `@lovable.dev/vite-tanstack-config` | the config bundles tanstackStart, react, tailwind, tsconfig paths and nitro. Do not add those plugins again in `vite.config.ts` |

The project was originally generated with Lovable; some Lovable files remain (section 12).

## 4. Architecture

Request flow:

```
Browser component
  -> hook (src/hooks/useX.ts, TanStack Query)
    -> server function (src/fns/*.ts, createServerFn RPC)
      -> Drizzle query (src/db/client.ts + schema.ts)
        -> MySQL
```

Directory map:

```
src/
  db/
    schema.ts                 all tables, enums, relations
    client.ts                 mysql2 pool + drizzle instance
    seed.ts                   first admin user + default settings
    fix-accounting-dates.ts   one-off data repair (already run)
  fns/                        server functions (the API). NOT named "server", see 5.1
    auth.ts                   login, verify token, change password, register
    tours.ts                  tours, scheduled tours, tour bookings
    data.ts                   customers, transfers, trips, fleet, accounting,
                              dashboard calendar, bulk email, settings
  hooks/                      one React Query hook file per domain
  lib/
    auth/jwt.ts               sign/verify JWT, hash/verify password, token storage helpers
    normalize.ts              normalizeDate / normalizeTime / normalizeDecimal
  routes/                     file-based routes (section 4.1)
  components/                 AppSidebar, LoginPage, PageHeader, StatusBadge
  routeTree.gen.ts            AUTO-GENERATED by the router plugin (section 5.5)
  start.ts                    global middleware registration
  server.ts                   SSR error wrapper (entry used by the build)
```

### 4.1 Routes

| URL | File | Purpose |
|---|---|---|
| `/` | `index.tsx` | Dashboard: month calendar of tours (amber), transfers (blue), trips (purple), KPIs, recent activity |
| `/tours` | `tours.index.tsx` | Tour catalog cards |
| `/tours/$tourId` | `tours.$tourId.tsx` | Scheduled departures for one tour; create/edit schedule drawers |
| `/tours/schedule/$scheduleId` | `tours.schedule.$scheduleId.tsx` | One departure: customers, vouchers, email, reminders |
| `/transfers`, `/transfers/$transferId`, `/transfers/schedule/$scheduleId` | `transfers.*` | Same three layers, plus flight and luggage fields |
| `/trips` | `trips.index.tsx` | Flat list of one-time trips with status tabs and create/edit drawer |
| `/trips/$tripId` | `trips.$tripId.tsx` | Trip details and its customers |
| `/customers` | `customers.index.tsx` | Every customer across all booking types |
| `/fleet` | `fleet.tsx` | Vehicles and drivers |
| `/accounting` | `accounting.tsx` | Entries, summary cards, inline status, CSV export, manual entry |
| `/settings` | `settings.tsx` | Agency profile, currency, voucher options, email configuration |

### 4.2 Domain layering

- Tours: `tours` (catalog) -> `scheduled_tours` (a dated departure with guide, vehicle, driver, capacity) -> `tour_bookings` (one customer, a seat count).
- Transfers: `transfers` (route) -> `scheduled_transfers` -> `transfer_bookings` (passengers, luggage, flight number/time).
- Trips: flat. `trips` (a single dated job) -> `trip_bookings`. No catalog layer because a trip is one-off.
- Every booking creates a `customers` row and an `accounting_entries` row.

## 5. Code conventions (read before changing anything)

### 5.1 Server functions live in `src/fns/`, never in a folder called `server`

TanStack Start's import protection denies any import matching `**/server/**` from client code, even for `createServerFn` exports. A folder named `src/server/` breaks the dev server with "Import denied in client environment". The folder was renamed to `src/fns/` for this reason. Keep it that way. Files named `*.server.ts` are server-only and must never be imported by client code.

### 5.2 Server function pattern

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db/client";

export const doThing = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), name: z.string().optional() }))
  .handler(async ({ data }) => {
    // data is typed and validated
    return { success: true };
  });
```

Calling convention from hooks: with a validator, `doThing({ data: { id } })`. Without a validator (list endpoints), `getThings()`. Plain `export async function` modules marked `"use server"` do not work in this setup.

### 5.3 Hook pattern

One hook file per domain. Types are derived from the server function return type so UI types follow the database automatically:

```ts
export type Trip = Awaited<ReturnType<typeof getTrips>>[number];
export function useTrips() {
  return useQuery({ queryKey: ["trips"], queryFn: () => getTrips() });
}
```

Query keys in use: `tours`, `["tours", id]`, `["scheduled_tours", tourId]`, `["scheduled_tours","detail",id]`, `scheduled_transfers` (same shapes), `all_schedules` (dashboard), `tour_bookings|transfer_bookings|trip_bookings` + parent id, `trips`, `["trips", id]`, `["accounting", filters]`, `accounting_summary`, `["customers", filters]`, `agency_settings`, `vehicles`, `drivers`.

Invalidation rule: any mutation that changes money or payment status should invalidate `accounting`, `accounting_summary` and `customers`. Some existing mutations invalidate only `accounting` (note `accounting_summary` is a different key, so it is not matched by prefix). Fix this when you touch those hooks.

### 5.4 Normalize everything that leaves the database

Drizzle and mysql2 return values that do not match what the UI expects. Normalize in the server function, not in components (`src/lib/normalize.ts`):

| Column type | What you get | Do this |
|---|---|---|
| `date` | JS `Date` at UTC midnight (observed) | `normalizeDate(d)` -> `"YYYY-MM-DD"` via `toISOString().slice(0,10)` |
| `time` | `"HH:MM:SS"` string | `normalizeTime(t)` -> `"HH:MM"` |
| `decimal` | string like `"27000.00"` | `normalizeDecimal(n)` -> number |
| `int` | number, but cast with `Number()` where a string has been seen | |
| `timestamp` | `Date` | this codebase stringifies it: `String(row.created_at)` |

Inserting: pass decimals as `String(number)`; pass dates as `"YYYY-MM-DD"` strings (cast `as any` where Drizzle's date type complains).

Never use `String(date)` for a date column (it produces `"Wed Oct 14 ..."` and MySQL rejects it). Never use `toISOString()` on a locally constructed Date to get a calendar day: in UTC+4 it shifts the day. The dashboard's `localDateStr()` builds `YYYY-MM-DD` from `getFullYear/getMonth/getDate` for that reason. Rule of thumb: dates from the database use `normalizeDate`; dates built in the browser use `localDateStr`.

### 5.5 `routeTree.gen.ts` is generated

`npm run dev` regenerates `src/routeTree.gen.ts` whenever route files change. Do not hand-edit it. After adding or renaming a route file, run `npm run dev` once, then commit the regenerated file. It was hand-edited a few times during development when files were pushed without running the dev server; avoid that. Because it regenerates locally, it often shows as modified in `git status` (section 10).

### 5.6 MySQL identifier limit

MySQL identifiers are limited to 64 characters. Drizzle names foreign keys `{table}_{column}_{reftable}_{refcolumn}_fk`. If that exceeds 64 characters, `db:push` fails with `ER_TOO_LONG_IDENT`. Fix by naming the key explicitly with `foreignKey({ name: "short_name", ... })`. Example in the schema: `tb_sched_transfer_fk` on `transfer_bookings`. Before adding a foreign key, count the characters.

### 5.7 UI conventions

- Pages use `PageHeader` and `EmptyState` from `src/components/PageHeader.tsx`; status pills use `StatusBadge`.
- Create/edit forms are shadcn `Sheet` drawers with a small local `F` (label + field) helper.
- Money is always rendered through `useCurrency().format(n)`; do not hardcode a currency symbol.
- Hooks must be called inside the component that uses their return value. A past crash came from `currencyCode` being destructured in a parent and referenced in a child drawer.

## 6. Data model

14 tables. All primary keys are cuid2 strings (`varchar(128)`).

| Table | Key columns | Relationships and behaviour |
|---|---|---|
| `users` | email (unique), password_hash, full_name | operators who can log in |
| `agency_settings` | agency_name, contact_email, currency, timezone, voucher_* flags, email_from_name, email_reply_to, resend_api_key | single logical row; code reads the first row |
| `vehicles` | name, type (van, bus, sedan, minibus), plate_number, capacity, status (available, on_trip, maintenance) | |
| `drivers` | full_name, phone, license_type, status (available, on_trip, off_duty), vehicle_id | vehicle_id -> vehicles, SET NULL |
| `tours` | name, description, duration, destination, base_price, is_active | soft-archived via is_active=false |
| `transfers` | name, origin, destination, base_price, is_active | soft-archived |
| `scheduled_tours` | tour_id, service_date, departure_time, guide_name, vehicle_id, driver_id, max_capacity, status (confirmed, pending, cancelled), notes | tour_id CASCADE; vehicle/driver SET NULL |
| `scheduled_transfers` | transfer_id, service_date, pickup_time, pickup_location, dropoff_location, driver_id, vehicle_id, status, notes | same rules |
| `trips` | title, description, trip_date, pickup_time, pickup_location, dropoff_location, vehicle_id, driver_id, status (confirmed, pending, cancelled, completed), base_price, notes | hard-deleted from the UI |
| `customers` | full_name, email, phone, booking_reference, special_requests, payment_status (paid, pending, refunded) | one row per booking (no de-duplication) |
| `tour_bookings` | scheduled_tour_id, customer_id, seat_count, voucher_status (pending, generated), amount, notes | both FKs CASCADE |
| `transfer_bookings` | scheduled_transfer_id, customer_id, passenger_count, luggage_count, flight_number, flight_time, voucher_status, amount, notes | both CASCADE; schedule FK explicitly named `tb_sched_transfer_fk` |
| `trip_bookings` | trip_id, customer_id, passenger_count, luggage_count, flight_number, flight_time, voucher_status, amount, notes | both CASCADE |
| `accounting_entries` | service_type (tour, transfer, trip), booking_id, customer_id, amount, payment_method, status (paid, pending, refunded), entry_date, notes | `booking_id` is a plain column, not a foreign key (it points at one of three booking tables depending on service_type); customer_id SET NULL |

Schema changes: edit `src/db/schema.ts`, then `npm run db:push` (development). `db:push` syncs directly and can drop data on destructive changes; for anything real use `db:generate` and a reviewed migration (section 11).

## 7. Domain behaviour

### 7.1 Creating a booking

`addTourBooking`, `addTransferBooking`, `addTripBooking` each, in order: insert a `customers` row, insert the booking row, insert an `accounting_entries` row. The entry uses the schedule's service date (or the trip date) as `entry_date`, the entered amount (0 if blank), and status `paid` if the customer was marked paid, otherwise `pending`. The UI passes `service_date` / `trip_date` into the call; if you add a new booking form, pass it too or the entry falls back to today. The three inserts are not in a transaction (section 11).

### 7.2 Payment status sync

`customers.payment_status` and `accounting_entries.status` are separate fields kept aligned in code:

- Changing a customer's payment status via `updateTourBooking`, `updateTripBooking` or `updateCustomer` (Customers tab) also updates the matching accounting entries (by `booking_id` for the first two, by `customer_id` for `updateCustomer`).
- Changing status from the Accounting tab's inline dropdown updates only the accounting entry. It does not update the customer. The sync is one-way.
- There is no `updateTransferBooking` function; transfer payment status is changed from the Customers tab.

### 7.3 Capacity and fleet

- Each scheduled tour has its own `max_capacity`. Selecting a vehicle in the schedule form fills it with the vehicle's seat count; it stays editable so a departure can be capped lower than the vehicle.
- The schedule table shows a red warning when seats booked exceed capacity and an amber one when 2 or fewer seats remain. Capacity is a warning only; the server does not reject overbooking.
- `drivers.vehicle_id` links a driver to a vehicle. Selecting a vehicle in a schedule or trip form auto-fills and locks the linked driver.

### 7.4 Currency

`agency_settings.currency` (ISO code) drives `useCurrency()` in `src/hooks/useCurrency.ts`, which maps the code to a symbol and exposes `format(amount)` (e.g. `"֏ 27,000"`) and `code`. The currency list exists in two places that must be kept in sync: `CURRENCIES` in `src/routes/settings.tsx` (the picker) and `CURRENCY_SYMBOLS` in `useCurrency.ts`. Amounts are stored as plain numbers with no conversion; changing the currency relabels existing amounts, it does not convert them.

### 7.5 Dashboard calendar

`getAllSchedules` merges scheduled tours, scheduled transfers and trips into one list of `{ id, kind, date, time, name, status, parentId }`. Colors: tour amber, transfer blue, trip purple. Trips link to `/trips/$tripId`; tours and transfers link to their schedule pages. Adding a new event kind means touching `getAllSchedules`, the `CalendarEvent` kind union, the color maps, the legend and the link/params logic in `routes/index.tsx`.

### 7.6 Email, reminders and vouchers

- Templates live in `src/hooks/useEmail.ts`: `build{Tour,Transfer,Trip}ConfirmationEmail` and `build{Tour,Transfer,Trip}ReminderEmail`. Each returns `{ subject, body }` as plain text; the sender wraps it in minimal HTML.
- "Send Reminders (N)" on each schedule/trip page sends the reminder template to every customer with an email address via the `sendBulkEmail` server function (parallel sends, returns sent/failed counts). Reminders are manual; nothing runs on a schedule.
- The per-customer mail button opens a dialog pre-filled with a template, editable before sending, sent through `useSendEmail`.
- Vouchers are generated by marking `voucher_status = 'generated'` and opening a printable HTML page in a new window (`window.print`). There is no server-side PDF.
- The settings flags `voucher_show_qr`, `voucher_auto_email` and `voucher_signature_line` are stored and editable but are not read anywhere in voucher rendering. Only `voucher_footer` is saved as text. Treat these as unimplemented.
- Sender address is hardcoded to `onboarding@resend.dev` in `useEmail.ts` and in `sendBulkEmail`. As far as I know Resend's shared testing sender only delivers to the email address on your own Resend account. To email real customers, verify a domain in Resend and change the `from` address in both places (check Resend's current docs).

## 8. Authentication

- Login: `serverLogin` checks the bcrypt hash and returns a signed JWT (HS256, 7 day expiry, payload `{ userId, email, fullName }`). The client stores it in localStorage under `vfo_auth_token` and reloads the page.
- `useAuth()` reads the token on mount and asks `serverVerifyToken` whether it is valid. `AuthGate` in `routes/__root.tsx` shows `LoginPage` when there is no valid user.
- The gate is client-side only. See section 11, item 1.
- `src/integrations/supabase/auth-attacher.ts` (misnamed, exports `attachSupabaseAuth`) is a global function middleware registered in `src/start.ts` that adds `Authorization: Bearer <token>` to every server function call. `auth-middleware.ts` exports `requireAuth`, a server middleware that verifies that header. It is written but not applied to any server function and has never been exercised in the running app. Test it before relying on it.

## 9. Recipes for extending the app

### 9.1 Add a field to an existing entity (example: `customers.nationality`)

1. `src/db/schema.ts`: add `nationality: varchar("nationality", { length: 100 })`.
2. `npm run db:push`.
3. `src/fns/data.ts`: add it to the Zod validators of `addTourBooking`, `addTransferBooking`, `addTripBooking` (create path), to `updateCustomer`, and to the `customers.insert` calls.
4. UI: add the input to the add/edit drawers and the Customers table. Hook types update automatically.

### 9.2 Add a new module (example: Guides)

1. Table and relations in `schema.ts`, then `db:push`.
2. `src/fns/guides.ts` with `createServerFn` functions; remember the pattern in 5.2.
3. `src/hooks/useGuides.ts`.
4. `src/routes/guides.index.tsx` (and `guides.$guideId.tsx` if needed). Run `npm run dev` so `routeTree.gen.ts` regenerates, then commit it.
5. Add the entry to the `items` array in `src/components/AppSidebar.tsx`.
6. If it carries money, create an `accounting_entries` row. A new `service_type` value must be added in four places: the enum in `schema.ts`, the Zod enums in `createAccountingEntry` and the type casts in `accounting.tsx`, and the service filter and Add Entry dropdowns in `accounting.tsx`.

### 9.3 Protect server functions (do this first)

Apply `requireAuth` to every function except `serverLogin` and `serverVerifyToken`:

```ts
import { requireAuth } from "@/integrations/supabase/auth-middleware";

export const getTours = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async () => { /* ... */ });
```

Suggested steps: verify the header actually arrives (log it once), then apply the middleware across `tours.ts` and `data.ts`, then delete or guard `serverRegister`. Consider moving the middleware out of the `supabase` folder (section 12). This approach is untested here; confirm against the TanStack Start docs for your installed version.

### 9.4 Reminders on a schedule

Today reminders are button-driven. To automate: write a small Node script (run with `tsx`, like `src/db/seed.ts`) that queries tomorrow's scheduled tours/transfers/trips with their customers, builds messages with the reminder templates and sends via the Resend API; run it daily with Windows Task Scheduler or a cron job. Reuse `buildTourReminderEmail` and friends. The templates currently live in a hook file; move them to a plain module under `src/lib/` first so both the UI and the script can import them. Record sent reminders in a table to avoid duplicates.

### 9.5 Add a currency or change the email sender

Currency: add to both lists in 7.4. Sender: change the `from` in `useEmail.ts` and `sendBulkEmail` (and ideally read it from `agency_settings`).

### 9.6 Deploying

Not yet done. Notes: the Lovable build config defaults nitro to a Cloudflare target, and `mysql2` needs Node TCP sockets, so use a Node server preset (check the options exposed by `@lovable.dev/vite-tanstack-config`); provide all env vars from `.env.example` on the host; use a managed or self-hosted MySQL reachable from the server; run migrations rather than `db:push`; and complete section 11 first.

## 10. Git workflow and environment gotchas

Workflow used so far: code is written and pushed to GitHub by Claude; the developer pulls and runs it locally.

- `git pull` is often blocked by local changes to `package-lock.json` and `src/routeTree.gen.ts` (both are regenerated by `npm install` and `npm run dev`). If you have no intentional edits to them: `git checkout -- package-lock.json src/routeTree.gen.ts`, then `git pull origin main`. If route files changed, commit the regenerated route tree instead.
- On Windows, `error: cannot spawn .git/hooks/post-checkout: No such file or directory` is harmless (a missing Git LFS hook); the checkout still succeeded.
- After pulling, run `npm install` when `package.json` changed, and `npm run db:push` when `schema.ts` changed.
- Never paste personal access tokens into chat or commit them into remote URLs. Prefer Git Credential Manager (`git config --global credential.helper manager`) or SSH keys. Tokens that have been shared in plain text should be revoked.
- Windows PowerShell does not accept `&&` in older versions; run commands separately.

## 11. Known gaps and hardening checklist

Ordered by priority. Items marked verified were confirmed in code on 2026-11-12.

Security (before any exposure beyond localhost)

1. **Server functions are unauthenticated (verified).** `requireAuth` is not applied anywhere, so anyone who can reach the server can call any read/write function directly, bypassing the login screen. The login gate is client-side only.
2. **`serverRegister` is public (verified)** and creates users with no authorization. It has no UI caller. Delete it or require an admin. It also derives the new user id from `insertId`, which is wrong for string ids, so tokens it issues carry a bad `userId`.
3. **`.env` was tracked in git; now untracked and ignored (fixed 2026-11-12).** The file is no longer in the repository and `.gitignore` excludes `.env` and `.env.*` (except `.env.example`). The old values remain in git history, so **rotate the MySQL password and `JWT_SECRET`** if the repository is or was shared. After pulling the untracking commit, an unmodified local `.env` is deleted by git; restore it from a copy.
4. **Hardcoded fallback secrets (verified)** in `src/db/client.ts`, `drizzle.config.ts` and `src/lib/auth/jwt.ts` (database password and JWT secret defaults). Remove the fallbacks and fail fast when the variables are missing.
5. **Default seeded admin password** is in `src/db/seed.ts`. Change it after first login and avoid committing real credentials in seeds.
6. **Resend API key** is stored in plain text in `agency_settings` and returned to the browser by `getSettings`; the client passes it back to `sendBulkEmail`. The single-send path (`useSendEmail`) calls Resend directly from the browser, which Resend may block with CORS and exposes the key. Move both to server-side reads of the key and route single sends through a server function.
7. JWTs live in localStorage (readable by any script on the page) and cannot be revoked before expiry.

Correctness and data integrity

8. **Orphaned accounting entries (verified).** `removeTourBooking`, `removeTransferBooking`, `removeTripBooking` and `deleteTrip` do not delete or void the related `accounting_entries`, and `booking_id` has no foreign key. Deleting a booking leaves its revenue entry behind.
9. **Booking creation is not transactional.** Customer, booking and accounting inserts are separate statements; a failure midway leaves partial data. Wrap in `db.transaction`.
10. **Payment sync is one-way** (7.2): editing status in the Accounting tab does not update the customer.
11. **No customer de-duplication.** Every booking creates a new customer row, so the same person booked twice appears twice in Customers.
12. **Seed is not idempotent for settings.** The settings row gets a random id, so running `db:seed` twice inserts a second `agency_settings` row; the app reads whichever comes first.
13. **No `updateTransferBooking`**; transfer bookings cannot be edited after creation except payment status via Customers.
14. Capacity is not enforced server-side; amounts are typed by hand rather than computed from price and seat count.
15. Some booking mutations invalidate only `accounting`, not `accounting_summary` or `customers` (5.3).
16. Voucher option flags are saved but unused (7.6). Reminder emails are manual and use the Resend testing sender (7.6).
17. `getAccountingEntries` and `getCustomers` fetch all rows then filter in JavaScript. Move filters into SQL and add pagination before the data grows.

Engineering hygiene

18. No automated tests. The only check used is `npx tsc --noEmit`; run it before every commit.
19. Uses `drizzle-kit push` instead of versioned migrations; adopt `db:generate` plus migrate for production.
20. No audit log for who changed what.

## 12. Legacy and dead code

Safe to clean up when convenient. Check with a search before deleting.

- `src/integrations/supabase/client.ts`, `client.server.ts`: stubs exporting `null`, kept to avoid broken imports. Nothing should use them.
- `src/integrations/supabase/types.ts`: generated Supabase types, unused.
- `src/integrations/supabase/auth-attacher.ts`, `auth-middleware.ts`: live code (JWT) living in a misnamed folder; moving them to `src/lib/auth/` and renaming `attachSupabaseAuth` also means updating `src/start.ts`.
- `src/lib/store.tsx` and `src/components/ScheduleDetail.tsx`: the original in-memory mock store from the Lovable prototype. `StoreProvider` still wraps the app in `routes/__root.tsx`. Real data no longer flows through it.
- `src/lib/api/example.functions.ts`, `config.server.ts`, `lovable-error-reporting.ts`, `error-capture.ts`, `error-page.ts`: Lovable scaffolding. `error-page.ts` is used by `start.ts` and `server.ts`; check usage of the others before removing.
- `supabase/migrations/*.sql` (if present): the old Postgres schema, kept only as history.

## 13. Troubleshooting log

Errors hit during development and their causes:

| Symptom | Cause | Fix |
|---|---|---|
| `ER_TOO_LONG_IDENT` during `db:push` | Auto-generated foreign key name over 64 chars | Explicit short FK name (5.6) |
| Vite: `[import-protection] Import denied in client environment ... **/server/**` | Folder named `server` | Use `src/fns/` (5.1) |
| Login: `Cannot read properties of null (reading 'auth')` | Leftover Supabase middleware calling a null client | Replaced with JWT middleware |
| `ERR_MODULE_NOT_FOUND '@supabase/supabase-js'` | Package removed but a file still imported it | Stub or delete the import |
| `Incorrect date value: 'Wed Oct 14'` | `String(Date)` written to a date column | `normalizeDate` / `toISOString().slice(0,10)` (5.4) |
| Calendar shows events one day early | `toISOString()` on a local Date in UTC+4 | `localDateStr()` (5.4) |
| Browser: "This page didn't load" and terminal `h3 swallowed SSR error` | Any server-side import/compile error | Read the terminal, run `npx tsc --noEmit` |
| Route exists but 404 or crash after adding a file | `routeTree.gen.ts` not regenerated | Run `npm run dev`, commit the file (5.5) |
| Accounting shows Pending after marking Paid | Status stored in two places, not synced | Sync added in 7.2 |
| Tour table shows `3 / 16` for a 4-seat departure | Schedule form hardcoded capacity 16 and display ignored the stored value | Fixed; re-save old schedules to correct stored capacity |
| `git pull` refused (package-lock.json, routeTree.gen.ts) | Locally regenerated files | Section 10 |

## 14. npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on port 8080; regenerates the route tree |
| `npm run build` / `build:dev` / `preview` | Production build and preview |
| `npm run db:push` | Sync `schema.ts` to MySQL (development) |
| `npm run db:generate` | Generate SQL migration files from schema changes |
| `npm run db:studio` | Drizzle Studio data browser |
| `npm run db:seed` | Create the first admin user and default settings (run once) |
| `npm run db:fix-dates` | One-off repair that set accounting entry dates to the actual service/trip date; already applied, safe to re-run |
| `npm run lint` / `format` | ESLint / Prettier |
| `npx tsc --noEmit` | Type check; use before every commit |
