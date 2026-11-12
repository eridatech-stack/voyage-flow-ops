---
name: intravelsync-add-feature
description: Step-by-step recipes for extending InTravelSync, including adding a field to an entity, a new module with route and sidebar entry, a server function and hook, a currency, a new accounting service type or a new calendar event kind. Use when asked to build or extend functionality in this repo.
---

# Adding features to InTravelSync

Reference: `docs/DEVELOPMENT.md` section 9 (recipes) and section 5 (conventions).

## A. New server function

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db/client";

export const doThing = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => { /* query via db, normalize outputs */ return { success: true }; });
```

- Put it in `src/fns/` only. List endpoints with no input omit `.inputValidator` and are called `fn()`; others are called `fn({ data })`.
- Normalize dates, times, decimals before returning (`src/lib/normalize.ts`). Stringify `created_at`.
- Insert decimals as `String(n)`, dates as `"YYYY-MM-DD"`.

## B. New hook

One file per domain in `src/hooks/`. Derive types from the server function:
`export type X = Awaited<ReturnType<typeof getX>>[number];`
Mutations: call `fn({ data })`, then invalidate every affected key and toast via `sonner`. If money or payment status changes, invalidate `accounting`, `accounting_summary` and `customers`.

## C. Add a field to an existing entity

1. `src/db/schema.ts` add the column. 2. `npm run db:push`. 3. Add it to the Zod validators and insert/update calls in `src/fns/*`. 4. Add inputs to the drawers/forms and the table. Customer fields are handled in: the three create functions (`addTourBooking` in `tours.ts`, `addTransferBooking` and `addTripBooking` in `data.ts`), `updateCustomer`, and the `customerUpdate` path of `updateTourBooking` (validated) and `updateTripBooking` (`z.any()`, so no validator to edit). Update every one that should carry the new field.

## D. New module (page with sidebar entry)

1. Table + relations in `schema.ts`, `db:push` (see `intravelsync-database-changes`).
2. `src/fns/<name>.ts`, `src/hooks/use<Name>.ts`.
3. `src/routes/<name>.index.tsx` (+ `<name>.$id.tsx`). Use `PageHeader`, `EmptyState`, `StatusBadge`, a shadcn `Sheet` drawer with the local `F` label helper. Hooks are called in the component that uses them.
4. Add an entry to `items` in `src/components/AppSidebar.tsx`.
5. Run `npm run dev` once so `routeTree.gen.ts` regenerates; commit it. Do not hand-edit it.
6. If it carries money, create an `accounting_entries` row (see `intravelsync-bookings-accounting`).

## E. New accounting `service_type`

Add the value in four places: the enum in `schema.ts`, the Zod enums in `createAccountingEntry`, the type casts in `src/routes/accounting.tsx`, and the filter plus Add Entry dropdowns there. Then `db:push`.

## F. New dashboard calendar event kind

Touch: `getAllSchedules` in `src/fns/data.ts`, the `CalendarEvent` kind union, the color maps and legend in `src/routes/index.tsx`, and the link plus params logic there (trips use `tripId`, schedules use `scheduleId`).

## G. New currency

Add to both `CURRENCIES` in `src/routes/settings.tsx` and `CURRENCY_SYMBOLS` in `src/hooks/useCurrency.ts`. Display amounts only through `useCurrency().format()`.

## Verify

`npx tsc --noEmit` (zero errors), then run the app and exercise the new path in the browser. Type checking does not catch runtime SSR errors; check the terminal.
