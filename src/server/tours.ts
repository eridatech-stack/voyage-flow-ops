import { normalizeDate, normalizeTime, normalizeDecimal } from "@/lib/normalize";
"use server";

import { db } from "@/db/client";
import { tours, scheduled_tours, tour_bookings, vehicles, drivers, customers, accounting_entries } from "@/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// ── Tours CRUD ───────────────────────────────────────────────────────────────

export async function getTours() {
  const rows = await db.select().from(tours).where(eq(tours.is_active, true)).orderBy(desc(tours.created_at));
  return rows.map((r) => ({ ...r, base_price: normalizeDecimal(r.base_price) }));
}

export async function getTour(id: string) {
  const [row] = await db.select().from(tours).where(eq(tours.id, id)).limit(1);
  if (!row) return null;
  return { ...row, base_price: normalizeDecimal(row.base_price) };
}

export async function createTour(data: {
  name: string; description?: string | null; duration?: string | null;
  destination?: string | null; base_price: number; is_active?: boolean;
}) {
  await db.insert(tours).values({ ...data, base_price: String(data.base_price) });
  return { success: true };
}

export async function updateTour(id: string, data: Partial<{
  name: string; description: string | null; duration: string | null;
  destination: string | null; base_price: number; is_active: boolean;
}>) {
  const patch: any = { ...data };
  if (data.base_price !== undefined) patch.base_price = String(data.base_price);
  await db.update(tours).set(patch).where(eq(tours.id, id));
  return { success: true };
}

export async function archiveTour(id: string) {
  await db.update(tours).set({ is_active: false }).where(eq(tours.id, id));
  return { success: true };
}

// ── Scheduled Tours ──────────────────────────────────────────────────────────

export async function getScheduledTours(tourId?: string) {
  const rows = await db.query.scheduled_tours.findMany({
    where: tourId ? eq(scheduled_tours.tour_id, tourId) : undefined,
    with: {
      tour: { columns: { name: true, destination: true, duration: true } },
      vehicle: { columns: { name: true, plate_number: true } },
      driver: { columns: { full_name: true } },
      bookings: { columns: { id: true, seat_count: true } },
    },
    orderBy: [asc(scheduled_tours.service_date)],
  });

  return rows.map((r) => ({
    ...r,
    service_date: normalizeDate(r.service_date as any) ?? "",
    departure_time: normalizeTime(r.departure_time as any),
    booking_count: r.bookings.length,
    total_seats: r.bookings.reduce((s, b) => s + b.seat_count, 0),
    bookings: undefined,
  }));
}

export async function getScheduledTour(id: string) {
  const row = await db.query.scheduled_tours.findFirst({
    where: eq(scheduled_tours.id, id),
    with: {
      tour: { columns: { name: true, destination: true, duration: true } },
      vehicle: { columns: { name: true, plate_number: true } },
      driver: { columns: { full_name: true } },
    },
  });
  if (!row) return undefined;
  return { ...row, service_date: normalizeDate(row.service_date as any) ?? "", departure_time: normalizeTime(row.departure_time as any) };
}

export async function createScheduledTour(data: {
  tour_id: string; service_date: string; departure_time?: string | null;
  guide_name?: string | null; vehicle_id?: string | null; driver_id?: string | null;
  max_capacity: number; status: string; notes?: string | null;
}) {
  await db.insert(scheduled_tours).values(data as any);
  return { success: true };
}

export async function updateScheduledTour(id: string, data: Partial<{
  service_date: string; departure_time: string | null; guide_name: string | null;
  vehicle_id: string | null; driver_id: string | null; max_capacity: number;
  status: string; notes: string | null;
}>) {
  await db.update(scheduled_tours).set(data as any).where(eq(scheduled_tours.id, id));
  return { success: true };
}

export async function deleteScheduledTour(id: string) {
  await db.delete(scheduled_tours).where(eq(scheduled_tours.id, id));
  return { success: true };
}

// ── Tour Bookings ────────────────────────────────────────────────────────────

export async function getTourBookings(scheduledTourId: string) {
  const rows = await db.query.tour_bookings.findMany({
    where: eq(tour_bookings.scheduled_tour_id, scheduledTourId),
    with: { customer: true },
    orderBy: [asc(tour_bookings.created_at)],
  });
  return rows.map((r) => ({ ...r, amount: r.amount != null ? normalizeDecimal(r.amount) : null }));
}

export async function addTourBooking(input: {
  scheduled_tour_id: string; seat_count: number; amount?: number;
  payment_method?: string; notes?: string;
  full_name: string; email?: string; phone?: string;
  booking_reference?: string; special_requests?: string;
  payment_status: "paid" | "pending" | "refunded";
}) {
  const customerId = createId();
  await db.insert(customers).values({
    id: customerId,
    full_name: input.full_name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    booking_reference: input.booking_reference ?? `BK-${Date.now().toString().slice(-6)}`,
    special_requests: input.special_requests ?? null,
    payment_status: input.payment_status,
  });

  const bookingId = createId();
  await db.insert(tour_bookings).values({
    id: bookingId,
    scheduled_tour_id: input.scheduled_tour_id,
    customer_id: customerId,
    seat_count: input.seat_count,
    amount: input.amount ? String(input.amount) : null,
    notes: input.notes ?? null,
    voucher_status: "pending",
  });

  // Auto-create accounting entry
  const ref = input.booking_reference ?? bookingId.slice(0, 8);
  await db.insert(accounting_entries).values({
    service_type: "tour",
    booking_id: bookingId,
    customer_id: customerId,
    amount: String(input.amount ?? 0),
    payment_method: input.payment_method ?? null,
    status: input.payment_status === "paid" ? "paid" : "pending",
    entry_date: new Date().toISOString().slice(0, 10) as any,
    notes: `Tour booking: ${ref}`,
  });

  return { success: true };
}

export async function updateTourBooking(input: {
  bookingId: string; customerId: string; scheduledTourId?: string;
  customerUpdate?: Partial<{ full_name: string; email: string | null; phone: string | null; booking_reference: string | null; special_requests: string | null; payment_status: "paid" | "pending" | "refunded" }>;
  bookingUpdate?: Partial<{ seat_count: number; notes: string | null; voucher_status: "pending" | "generated" }>;
}) {
  if (input.customerUpdate) {
    await db.update(customers).set(input.customerUpdate).where(eq(customers.id, input.customerId));
  }
  if (input.bookingUpdate) {
    await db.update(tour_bookings).set(input.bookingUpdate).where(eq(tour_bookings.id, input.bookingId));
  }
  return { success: true };
}

export async function generateTourVoucher(bookingId: string) {
  await db.update(tour_bookings).set({ voucher_status: "generated" }).where(eq(tour_bookings.id, bookingId));
  return { success: true };
}

export async function generateAllTourVouchers(scheduledTourId: string) {
  await db.update(tour_bookings).set({ voucher_status: "generated" }).where(eq(tour_bookings.scheduled_tour_id, scheduledTourId));
  return { success: true };
}

export async function removeTourBooking(bookingId: string) {
  await db.delete(tour_bookings).where(eq(tour_bookings.id, bookingId));
  return { success: true };
}
