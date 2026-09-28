import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db/client";
import { tours, scheduled_tours, tour_bookings, customers, accounting_entries } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { normalizeDate, normalizeTime, normalizeDecimal } from "@/lib/normalize";

// ── Tours ────────────────────────────────────────────────────────────────────

export const getTours = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db.select().from(tours).where(eq(tours.is_active, true)).orderBy(desc(tours.created_at));
  return rows.map((r) => ({ ...r, base_price: normalizeDecimal(r.base_price), created_at: String(r.created_at) }));
});

export const getTour = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const [row] = await db.select().from(tours).where(eq(tours.id, data.id)).limit(1);
    if (!row) return null;
    return { ...row, base_price: normalizeDecimal(row.base_price), created_at: String(row.created_at) };
  });

export const createTour = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string(), description: z.string().nullish(), duration: z.string().nullish(), destination: z.string().nullish(), base_price: z.number(), is_active: z.boolean().optional() }))
  .handler(async ({ data }) => {
    await db.insert(tours).values({ ...data, base_price: String(data.base_price) } as any);
    return { success: true };
  });

export const updateTour = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), name: z.string().optional(), description: z.string().nullish(), duration: z.string().nullish(), destination: z.string().nullish(), base_price: z.number().optional(), is_active: z.boolean().optional() }))
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    const patch: any = { ...rest };
    if (rest.base_price !== undefined) patch.base_price = String(rest.base_price);
    await db.update(tours).set(patch).where(eq(tours.id, id));
    return { success: true };
  });

export const archiveTour = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.update(tours).set({ is_active: false }).where(eq(tours.id, data.id));
    return { success: true };
  });

// ── Scheduled Tours ──────────────────────────────────────────────────────────

export const getScheduledTours = createServerFn({ method: "GET" })
  .inputValidator(z.object({ tourId: z.string().optional() }))
  .handler(async ({ data }) => {
    const rows = await db.query.scheduled_tours.findMany({
      where: data.tourId ? eq(scheduled_tours.tour_id, data.tourId) : undefined,
      with: { tour: { columns: { name: true, destination: true, duration: true } }, vehicle: { columns: { name: true, plate_number: true } }, driver: { columns: { full_name: true } }, bookings: { columns: { id: true, seat_count: true } } },
      orderBy: [asc(scheduled_tours.service_date)],
    });
    return rows.map((r) => ({ ...r, service_date: normalizeDate(r.service_date as any) ?? "", departure_time: normalizeTime(r.departure_time as any), created_at: String(r.created_at), booking_count: r.bookings.length, total_seats: r.bookings.reduce((s, b) => s + b.seat_count, 0), bookings: undefined }));
  });

export const getScheduledTour = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.scheduled_tours.findFirst({
      where: eq(scheduled_tours.id, data.id),
      with: { tour: { columns: { name: true, destination: true, duration: true } }, vehicle: { columns: { name: true, plate_number: true } }, driver: { columns: { full_name: true } } },
    });
    if (!row) return null;
    return { ...row, service_date: normalizeDate(row.service_date as any) ?? "", departure_time: normalizeTime(row.departure_time as any), created_at: String(row.created_at) };
  });

export const createScheduledTour = createServerFn({ method: "POST" })
  .inputValidator(z.object({ tour_id: z.string(), service_date: z.string(), departure_time: z.string().nullish(), guide_name: z.string().nullish(), vehicle_id: z.string().nullish(), driver_id: z.string().nullish(), max_capacity: z.number(), status: z.string(), notes: z.string().nullish() }))
  .handler(async ({ data }) => {
    await db.insert(scheduled_tours).values(data as any);
    return { success: true };
  });

export const updateScheduledTour = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), service_date: z.string().optional(), departure_time: z.string().nullish(), guide_name: z.string().nullish(), vehicle_id: z.string().nullish(), driver_id: z.string().nullish(), max_capacity: z.number().optional(), status: z.string().optional(), notes: z.string().nullish() }))
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    await db.update(scheduled_tours).set(rest as any).where(eq(scheduled_tours.id, id));
    return { success: true };
  });

export const deleteScheduledTour = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(scheduled_tours).where(eq(scheduled_tours.id, data.id));
    return { success: true };
  });

// ── Tour Bookings ────────────────────────────────────────────────────────────

export const getTourBookings = createServerFn({ method: "GET" })
  .inputValidator(z.object({ scheduledTourId: z.string() }))
  .handler(async ({ data }) => {
    const rows = await db.query.tour_bookings.findMany({
      where: eq(tour_bookings.scheduled_tour_id, data.scheduledTourId),
      with: { customer: true },
      orderBy: [asc(tour_bookings.created_at)],
    });
    return rows.map((r) => ({ ...r, amount: r.amount != null ? normalizeDecimal(r.amount) : null, created_at: String(r.created_at), customer: { ...r.customer, created_at: String(r.customer.created_at) } }));
  });

export const addTourBooking = createServerFn({ method: "POST" })
  .inputValidator(z.object({ scheduled_tour_id: z.string(), seat_count: z.number(), service_date: z.string().optional(), amount: z.number().optional(), payment_method: z.string().optional(), notes: z.string().optional(), full_name: z.string(), email: z.string().optional(), phone: z.string().optional(), booking_reference: z.string().optional(), special_requests: z.string().optional(), payment_status: z.enum(["paid", "pending", "refunded"]) }))
  .handler(async ({ data }) => {
    const customerId = createId();
    await db.insert(customers).values({ id: customerId, full_name: data.full_name, email: data.email ?? null, phone: data.phone ?? null, booking_reference: data.booking_reference ?? `BK-${Date.now().toString().slice(-6)}`, special_requests: data.special_requests ?? null, payment_status: data.payment_status });
    const bookingId = createId();
    await db.insert(tour_bookings).values({ id: bookingId, scheduled_tour_id: data.scheduled_tour_id, customer_id: customerId, seat_count: data.seat_count, amount: data.amount ? String(data.amount) : null, notes: data.notes ?? null, voucher_status: "pending" });
    await db.insert(accounting_entries).values({ service_type: "tour", booking_id: bookingId, customer_id: customerId, amount: String(data.amount ?? 0), payment_method: data.payment_method ?? null, status: data.payment_status === "paid" ? "paid" : "pending", entry_date: (data.service_date ?? new Date().toISOString().slice(0, 10)) as any, notes: `Tour booking: ${data.booking_reference ?? bookingId.slice(0, 8)}` });
    return { success: true };
  });

export const updateTourBooking = createServerFn({ method: "POST" })
  .inputValidator(z.object({ bookingId: z.string(), customerId: z.string(), scheduledTourId: z.string().optional(), customerUpdate: z.object({ full_name: z.string().optional(), email: z.string().nullish(), phone: z.string().nullish(), booking_reference: z.string().nullish(), special_requests: z.string().nullish(), payment_status: z.enum(["paid", "pending", "refunded"]).optional() }).optional(), bookingUpdate: z.object({ seat_count: z.number().optional(), notes: z.string().nullish(), voucher_status: z.enum(["pending", "generated"]).optional() }).optional() }))
  .handler(async ({ data }) => {
    if (data.customerUpdate) await db.update(customers).set(data.customerUpdate as any).where(eq(customers.id, data.customerId));
    if (data.bookingUpdate) await db.update(tour_bookings).set(data.bookingUpdate as any).where(eq(tour_bookings.id, data.bookingId));
    return { success: true };
  });

export const generateTourVoucher = createServerFn({ method: "POST" })
  .inputValidator(z.object({ bookingId: z.string() }))
  .handler(async ({ data }) => {
    await db.update(tour_bookings).set({ voucher_status: "generated" }).where(eq(tour_bookings.id, data.bookingId));
    return { success: true };
  });

export const generateAllTourVouchers = createServerFn({ method: "POST" })
  .inputValidator(z.object({ scheduledTourId: z.string() }))
  .handler(async ({ data }) => {
    await db.update(tour_bookings).set({ voucher_status: "generated" }).where(eq(tour_bookings.scheduled_tour_id, data.scheduledTourId));
    return { success: true };
  });

export const removeTourBooking = createServerFn({ method: "POST" })
  .inputValidator(z.object({ bookingId: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(tour_bookings).where(eq(tour_bookings.id, data.bookingId));
    return { success: true };
  });
