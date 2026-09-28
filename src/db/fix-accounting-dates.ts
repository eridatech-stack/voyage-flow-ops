/**
 * Run with: npx tsx src/db/fix-accounting-dates.ts
 *
 * Updates entry_date on all accounting_entries to match the actual
 * service_date of the tour/transfer schedule or trip_date of the trip,
 * looked up via the booking_id column.
 */
import { db } from "./client";
import { accounting_entries, tour_bookings, transfer_bookings, trip_bookings, scheduled_tours, scheduled_transfers, trips } from "./schema";
import { eq } from "drizzle-orm";

async function fixDates() {
  console.log("🔧 Fixing accounting entry dates...\n");

  const entries = await db.select({
    id: accounting_entries.id,
    service_type: accounting_entries.service_type,
    booking_id: accounting_entries.booking_id,
    entry_date: accounting_entries.entry_date,
  }).from(accounting_entries);

  let fixed = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry.booking_id) { skipped++; continue; }

    let serviceDate: string | null = null;

    if (entry.service_type === "tour") {
      const [booking] = await db
        .select({ service_date: scheduled_tours.service_date })
        .from(tour_bookings)
        .innerJoin(scheduled_tours, eq(tour_bookings.scheduled_tour_id, scheduled_tours.id))
        .where(eq(tour_bookings.id, entry.booking_id))
        .limit(1);
      if (booking?.service_date) {
        serviceDate = String(booking.service_date).slice(0, 10);
      }

    } else if (entry.service_type === "transfer") {
      const [booking] = await db
        .select({ service_date: scheduled_transfers.service_date })
        .from(transfer_bookings)
        .innerJoin(scheduled_transfers, eq(transfer_bookings.scheduled_transfer_id, scheduled_transfers.id))
        .where(eq(transfer_bookings.id, entry.booking_id))
        .limit(1);
      if (booking?.service_date) {
        serviceDate = String(booking.service_date).slice(0, 10);
      }

    } else if (entry.service_type === "trip") {
      const [booking] = await db
        .select({ trip_date: trips.trip_date })
        .from(trip_bookings)
        .innerJoin(trips, eq(trip_bookings.trip_id, trips.id))
        .where(eq(trip_bookings.id, entry.booking_id))
        .limit(1);
      if (booking?.trip_date) {
        serviceDate = String(booking.trip_date).slice(0, 10);
      }
    }

    if (serviceDate) {
      const currentDate = String(entry.entry_date).slice(0, 10);

      if (currentDate !== serviceDate) {
        await db.update(accounting_entries)
          .set({ entry_date: serviceDate as any })
          .where(eq(accounting_entries.id, entry.id));
        console.log(`  ✓ ${entry.id.slice(0, 8)} [${entry.service_type}] ${currentDate} → ${serviceDate}`);
        fixed++;
      } else {
        skipped++;
      }
    } else {
      console.log(`  ⚠ ${entry.id.slice(0, 8)} [${entry.service_type}] no booking found, skipped`);
      skipped++;
    }
  }

  console.log(`\n✅ Done — ${fixed} updated, ${skipped} already correct or skipped`);
  process.exit(0);
}

fixDates().catch((e) => { console.error(e); process.exit(1); });
