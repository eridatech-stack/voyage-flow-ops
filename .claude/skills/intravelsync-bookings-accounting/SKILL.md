---
name: intravelsync-bookings-accounting
description: Business rules for InTravelSync bookings, customers, payment status, accounting entries, capacity, vouchers, reminder emails and currency. Use when touching booking creation or edits, payment status, the Accounting or Customers pages, emails or money display.
---

# Bookings, payments and accounting

Reference: `docs/DEVELOPMENT.md` section 7 and section 11 (items 6, 8-17).

## Creating a booking

`addTourBooking` (`src/fns/tours.ts`), `addTransferBooking` and `addTripBooking` (`src/fns/data.ts`) each insert, in order: a `customers` row, the booking row, an `accounting_entries` row.

- `entry_date` is the schedule's `service_date` (trips: `trip_date`), not today. The UI passes it into the call; a new booking form must pass it too or the entry falls back to today.
- Entry amount is the typed amount (0 if blank). Entry status is `paid` only if the customer was marked paid, otherwise `pending`.
- `accounting_entries.booking_id` points at one of three booking tables depending on `service_type`. It is not a foreign key.

## Payment status lives in two places

`customers.payment_status` and `accounting_entries.status` are kept aligned in code:

- `updateTourBooking`, `updateTripBooking`: changing the customer's status also updates entries matching `booking_id`.
- `updateCustomer` (Customers tab): updates all entries matching `customer_id`.
- Accounting tab inline dropdown: updates the entry only. The customer is not updated (one-way sync, known gap).
- No `updateTransferBooking` exists; transfer payment status changes via the Customers tab.

If you add another place that edits payment status, apply the same sync and invalidate `accounting`, `accounting_summary` and `customers`. Note `accounting_summary` is a separate query key; invalidating `accounting` does not refresh the summary cards.

## Deleting

`removeTourBooking`, `removeTransferBooking`, `removeTripBooking`, `deleteTrip` leave the related accounting entry behind. If you touch these, delete or void the entry by `booking_id` in the same operation (ideally in a transaction).

## Capacity and fleet

- `scheduled_tours.max_capacity` is per departure. Choosing a vehicle fills it with the vehicle's seats; it stays editable. Capacity is a UI warning only (red when over, amber at 2 seats or fewer left); the server does not reject overbooking.
- A driver is linked to a vehicle via `drivers.vehicle_id`; selecting the vehicle auto-fills and locks the driver.

## Money

Amounts are plain numbers with no conversion. The agency currency (`agency_settings.currency`) only changes the label via `useCurrency().format(n)`; changing it does not convert existing amounts. Never hardcode a symbol.

## Vouchers

Generating a voucher sets `voucher_status = 'generated'` and opens a printable HTML page (`window.print`). There is no server PDF. Settings flags `voucher_show_qr`, `voucher_auto_email`, `voucher_signature_line` are stored but not used in rendering; treat as unimplemented.

## Emails and reminders

- Templates: `src/hooks/useEmail.ts` (`build{Tour,Transfer,Trip}{Confirmation,Reminder}Email`), plain text, wrapped in minimal HTML when sent.
- "Send Reminders (N)" calls `sendBulkEmail` (server function, parallel Resend sends, returns sent and failed counts). Reminders are manual; nothing runs on a schedule.
- The `from` address is hardcoded to `onboarding@resend.dev` in `useEmail.ts` and `sendBulkEmail`. As far as is known, Resend's shared test sender only delivers to the account owner's own address; real customers need a verified domain and a changed `from` in both places. Check Resend's current docs.
- The Resend API key is stored in plain text in `agency_settings` and returned to the browser. Do not log it or echo it into output; moving it server-side is on the hardening list.
