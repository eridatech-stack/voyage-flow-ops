import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db/client";
import {
  transfers, scheduled_transfers, transfer_bookings,
  trips, trip_bookings, vehicles, drivers,
  customers, accounting_entries, agency_settings,
} from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { normalizeDate, normalizeTime, normalizeDecimal } from "@/lib/normalize";

// ── Transfers ────────────────────────────────────────────────────────────────

export const getTransfers = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db.select().from(transfers).where(eq(transfers.is_active, true)).orderBy(desc(transfers.created_at));
  return rows.map((r) => ({ ...r, base_price: normalizeDecimal(r.base_price), created_at: String(r.created_at) }));
});

export const getTransfer = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const [row] = await db.select().from(transfers).where(eq(transfers.id, data.id)).limit(1);
    if (!row) return null;
    return { ...row, base_price: normalizeDecimal(row.base_price), created_at: String(row.created_at) };
  });

export const createTransfer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string(), origin: z.string().nullish(), destination: z.string().nullish(), base_price: z.number() }))
  .handler(async ({ data }) => {
    await db.insert(transfers).values({ ...data, base_price: String(data.base_price), is_active: true } as any);
    return { success: true };
  });

export const updateTransfer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), name: z.string().optional(), origin: z.string().nullish(), destination: z.string().nullish(), base_price: z.number().optional(), is_active: z.boolean().optional() }))
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    const patch: any = { ...rest };
    if (rest.base_price !== undefined) patch.base_price = String(rest.base_price);
    await db.update(transfers).set(patch).where(eq(transfers.id, id));
    return { success: true };
  });

export const archiveTransfer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.update(transfers).set({ is_active: false }).where(eq(transfers.id, data.id));
    return { success: true };
  });

// ── Scheduled Transfers ──────────────────────────────────────────────────────

export const getScheduledTransfers = createServerFn({ method: "GET" })
  .inputValidator(z.object({ transferId: z.string().optional() }))
  .handler(async ({ data }) => {
    const rows = await db.query.scheduled_transfers.findMany({
      where: data.transferId ? eq(scheduled_transfers.transfer_id, data.transferId) : undefined,
      with: { transfer: { columns: { name: true, origin: true, destination: true } }, vehicle: { columns: { name: true, plate_number: true } }, driver: { columns: { full_name: true } }, bookings: { columns: { id: true, passenger_count: true } } },
      orderBy: [asc(scheduled_transfers.service_date)],
    });
    return rows.map((r) => ({ ...r, service_date: normalizeDate(r.service_date as any) ?? "", pickup_time: normalizeTime(r.pickup_time as any), created_at: String(r.created_at), booking_count: r.bookings.length, bookings: undefined }));
  });

export const getScheduledTransfer = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.scheduled_transfers.findFirst({
      where: eq(scheduled_transfers.id, data.id),
      with: { transfer: { columns: { name: true, origin: true, destination: true } }, vehicle: { columns: { name: true, plate_number: true } }, driver: { columns: { full_name: true } } },
    });
    if (!row) return null;
    return { ...row, service_date: normalizeDate(row.service_date as any) ?? "", pickup_time: normalizeTime(row.pickup_time as any), created_at: String(row.created_at) };
  });

export const createScheduledTransfer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ transfer_id: z.string(), service_date: z.string(), pickup_time: z.string().nullish(), pickup_location: z.string().nullish(), dropoff_location: z.string().nullish(), driver_id: z.string().nullish(), vehicle_id: z.string().nullish(), status: z.string(), notes: z.string().nullish() }))
  .handler(async ({ data }) => {
    await db.insert(scheduled_transfers).values(data as any);
    return { success: true };
  });

export const updateScheduledTransfer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), service_date: z.string().optional(), pickup_time: z.string().nullish(), pickup_location: z.string().nullish(), dropoff_location: z.string().nullish(), driver_id: z.string().nullish(), vehicle_id: z.string().nullish(), status: z.string().optional(), notes: z.string().nullish() }))
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    await db.update(scheduled_transfers).set(rest as any).where(eq(scheduled_transfers.id, id));
    return { success: true };
  });

export const getTransferBookings = createServerFn({ method: "GET" })
  .inputValidator(z.object({ scheduledTransferId: z.string() }))
  .handler(async ({ data }) => {
    const rows = await db.query.transfer_bookings.findMany({
      where: eq(transfer_bookings.scheduled_transfer_id, data.scheduledTransferId),
      with: { customer: true },
      orderBy: [asc(transfer_bookings.created_at)],
    });
    return rows.map((r) => ({ ...r, amount: r.amount != null ? normalizeDecimal(r.amount) : null, created_at: String(r.created_at), customer: { ...r.customer, created_at: String(r.customer.created_at) } }));
  });

export const addTransferBooking = createServerFn({ method: "POST" })
  .inputValidator(z.object({ scheduled_transfer_id: z.string(), passenger_count: z.number(), luggage_count: z.number(), flight_number: z.string().optional(), flight_time: z.string().optional(), amount: z.number().optional(), payment_method: z.string().optional(), notes: z.string().optional(), full_name: z.string(), email: z.string().optional(), phone: z.string().optional(), booking_reference: z.string().optional(), special_requests: z.string().optional(), payment_status: z.enum(["paid", "pending", "refunded"]) }))
  .handler(async ({ data }) => {
    const customerId = createId();
    await db.insert(customers).values({ id: customerId, full_name: data.full_name, email: data.email ?? null, phone: data.phone ?? null, booking_reference: data.booking_reference ?? `BK-${Date.now().toString().slice(-6)}`, special_requests: data.special_requests ?? null, payment_status: data.payment_status });
    const bookingId = createId();
    await db.insert(transfer_bookings).values({ id: bookingId, scheduled_transfer_id: data.scheduled_transfer_id, customer_id: customerId, passenger_count: data.passenger_count, luggage_count: data.luggage_count, flight_number: data.flight_number ?? null, flight_time: data.flight_time ?? null, amount: data.amount ? String(data.amount) : null, notes: data.notes ?? null, voucher_status: "pending" });
    await db.insert(accounting_entries).values({ service_type: "transfer", booking_id: bookingId, customer_id: customerId, amount: String(data.amount ?? 0), payment_method: data.payment_method ?? null, status: data.payment_status === "paid" ? "paid" : "pending", entry_date: new Date().toISOString().slice(0, 10) as any, notes: `Transfer: ${data.booking_reference ?? bookingId.slice(0, 8)}` });
    return { success: true };
  });

export const generateTransferVoucher = createServerFn({ method: "POST" })
  .inputValidator(z.object({ bookingId: z.string() }))
  .handler(async ({ data }) => {
    await db.update(transfer_bookings).set({ voucher_status: "generated" }).where(eq(transfer_bookings.id, data.bookingId));
    return { success: true };
  });

export const generateAllTransferVouchers = createServerFn({ method: "POST" })
  .inputValidator(z.object({ scheduledTransferId: z.string() }))
  .handler(async ({ data }) => {
    await db.update(transfer_bookings).set({ voucher_status: "generated" }).where(eq(transfer_bookings.scheduled_transfer_id, data.scheduledTransferId));
    return { success: true };
  });

export const removeTransferBooking = createServerFn({ method: "POST" })
  .inputValidator(z.object({ bookingId: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(transfer_bookings).where(eq(transfer_bookings.id, data.bookingId));
    return { success: true };
  });

// ── Trips ────────────────────────────────────────────────────────────────────

export const getTrips = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db.query.trips.findMany({
    with: { vehicle: { columns: { name: true, plate_number: true, capacity: true } }, driver: { columns: { full_name: true } }, bookings: { columns: { id: true, passenger_count: true } } },
    orderBy: [desc(trips.trip_date)],
  });
  return rows.map((r) => ({ ...r, trip_date: normalizeDate(r.trip_date as any) ?? "", pickup_time: normalizeTime(r.pickup_time as any), base_price: normalizeDecimal(r.base_price), created_at: String(r.created_at), booking_count: r.bookings.length, total_passengers: r.bookings.reduce((s, b) => s + b.passenger_count, 0), bookings: undefined }));
});

export const getTrip = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.trips.findFirst({
      where: eq(trips.id, data.id),
      with: { vehicle: { columns: { name: true, plate_number: true, capacity: true } }, driver: { columns: { full_name: true } } },
    });
    if (!row) return null;
    return { ...row, trip_date: normalizeDate(row.trip_date as any) ?? "", pickup_time: normalizeTime(row.pickup_time as any), base_price: normalizeDecimal(row.base_price), created_at: String(row.created_at) };
  });

export const createTrip = createServerFn({ method: "POST" })
  .inputValidator(z.object({ title: z.string(), description: z.string().nullish(), trip_date: z.string(), pickup_time: z.string().nullish(), pickup_location: z.string().nullish(), dropoff_location: z.string().nullish(), vehicle_id: z.string().nullish(), driver_id: z.string().nullish(), status: z.string(), base_price: z.number(), notes: z.string().nullish() }))
  .handler(async ({ data }) => {
    await db.insert(trips).values({ ...data, base_price: String(data.base_price) } as any);
    return { success: true };
  });

export const updateTrip = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), title: z.string().optional(), description: z.string().nullish(), trip_date: z.string().optional(), pickup_time: z.string().nullish(), pickup_location: z.string().nullish(), dropoff_location: z.string().nullish(), vehicle_id: z.string().nullish(), driver_id: z.string().nullish(), status: z.string().optional(), base_price: z.number().optional(), notes: z.string().nullish() }))
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    const patch: any = { ...rest };
    if (rest.base_price !== undefined) patch.base_price = String(rest.base_price);
    await db.update(trips).set(patch).where(eq(trips.id, id));
    return { success: true };
  });

export const deleteTrip = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(trips).where(eq(trips.id, data.id));
    return { success: true };
  });

export const getTripBookings = createServerFn({ method: "GET" })
  .inputValidator(z.object({ tripId: z.string() }))
  .handler(async ({ data }) => {
    const rows = await db.query.trip_bookings.findMany({
      where: eq(trip_bookings.trip_id, data.tripId),
      with: { customer: true },
      orderBy: [asc(trip_bookings.created_at)],
    });
    return rows.map((r) => ({ ...r, amount: r.amount != null ? normalizeDecimal(r.amount) : null, created_at: String(r.created_at), customer: { ...r.customer, created_at: String(r.customer.created_at) } }));
  });

export const addTripBooking = createServerFn({ method: "POST" })
  .inputValidator(z.object({ trip_id: z.string(), passenger_count: z.number(), luggage_count: z.number(), flight_number: z.string().optional(), flight_time: z.string().optional(), amount: z.number().optional(), notes: z.string().optional(), full_name: z.string(), email: z.string().optional(), phone: z.string().optional(), booking_reference: z.string().optional(), special_requests: z.string().optional(), payment_status: z.enum(["paid", "pending", "refunded"]) }))
  .handler(async ({ data }) => {
    const customerId = createId();
    await db.insert(customers).values({ id: customerId, full_name: data.full_name, email: data.email ?? null, phone: data.phone ?? null, booking_reference: data.booking_reference ?? `TR-${Date.now().toString().slice(-6)}`, special_requests: data.special_requests ?? null, payment_status: data.payment_status });
    const bookingId = createId();
    await db.insert(trip_bookings).values({ id: bookingId, trip_id: data.trip_id, customer_id: customerId, passenger_count: data.passenger_count, luggage_count: data.luggage_count, flight_number: data.flight_number ?? null, flight_time: data.flight_time ?? null, amount: data.amount ? String(data.amount) : null, notes: data.notes ?? null, voucher_status: "pending" });
    await db.insert(accounting_entries).values({ service_type: "trip", booking_id: bookingId, customer_id: customerId, amount: String(data.amount ?? 0), payment_method: null, status: data.payment_status === "paid" ? "paid" : "pending", entry_date: new Date().toISOString().slice(0, 10) as any, notes: `Trip: ${data.booking_reference ?? bookingId.slice(0, 8)}` });
    return { success: true };
  });

export const updateTripBooking = createServerFn({ method: "POST" })
  .inputValidator(z.object({ bookingId: z.string(), customerId: z.string(), tripId: z.string().optional(), customerUpdate: z.any().optional(), bookingUpdate: z.any().optional() }))
  .handler(async ({ data }) => {
    if (data.customerUpdate) await db.update(customers).set(data.customerUpdate).where(eq(customers.id, data.customerId));
    if (data.bookingUpdate) await db.update(trip_bookings).set(data.bookingUpdate).where(eq(trip_bookings.id, data.bookingId));
    return { success: true };
  });

export const generateTripVoucher = createServerFn({ method: "POST" })
  .inputValidator(z.object({ bookingId: z.string() }))
  .handler(async ({ data }) => {
    await db.update(trip_bookings).set({ voucher_status: "generated" }).where(eq(trip_bookings.id, data.bookingId));
    return { success: true };
  });

export const removeTripBooking = createServerFn({ method: "POST" })
  .inputValidator(z.object({ bookingId: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(trip_bookings).where(eq(trip_bookings.id, data.bookingId));
    return { success: true };
  });

// ── Fleet ────────────────────────────────────────────────────────────────────

export const getVehicles = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(vehicles).orderBy(asc(vehicles.name));
});

export const createVehicle = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string(), type: z.enum(["van", "bus", "sedan", "minibus"]), plate_number: z.string(), capacity: z.number(), status: z.enum(["available", "on_trip", "maintenance"]) }))
  .handler(async ({ data }) => {
    await db.insert(vehicles).values(data);
    return { success: true };
  });

export const updateVehicle = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), name: z.string().optional(), type: z.enum(["van", "bus", "sedan", "minibus"]).optional(), plate_number: z.string().optional(), capacity: z.number().optional(), status: z.enum(["available", "on_trip", "maintenance"]).optional() }))
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    await db.update(vehicles).set(rest).where(eq(vehicles.id, id));
    return { success: true };
  });

export const getDrivers = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db.query.drivers.findMany({ with: { vehicle: { columns: { name: true, plate_number: true } } }, orderBy: [asc(drivers.full_name)] });
  return rows.map((r) => ({ ...r, created_at: String(r.created_at) }));
});

export const createDriver = createServerFn({ method: "POST" })
  .inputValidator(z.object({ full_name: z.string(), phone: z.string().nullish(), license_type: z.string().nullish(), status: z.enum(["available", "on_trip", "off_duty"]), vehicle_id: z.string().nullish() }))
  .handler(async ({ data }) => {
    await db.insert(drivers).values(data);
    return { success: true };
  });

export const updateDriver = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), full_name: z.string().optional(), phone: z.string().nullish(), license_type: z.string().nullish(), status: z.enum(["available", "on_trip", "off_duty"]).optional(), vehicle_id: z.string().nullish() }))
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    await db.update(drivers).set(rest as any).where(eq(drivers.id, id));
    return { success: true };
  });

// ── Accounting ───────────────────────────────────────────────────────────────

export const getAccountingEntries = createServerFn({ method: "GET" })
  .inputValidator(z.object({ from: z.string().optional(), to: z.string().optional(), status: z.string().optional(), service_type: z.string().optional() }))
  .handler(async ({ data }) => {
    const rows = await db.query.accounting_entries.findMany({ with: { customer: { columns: { full_name: true } } }, orderBy: [desc(accounting_entries.entry_date)] });
    return rows
      .map((r) => ({ ...r, amount: normalizeDecimal(r.amount), entry_date: normalizeDate(r.entry_date as any) ?? "", created_at: String(r.created_at) }))
      .filter((e) => {
        if (data.from && String(e.entry_date) < data.from) return false;
        if (data.to && String(e.entry_date) > data.to) return false;
        if (data.status && data.status !== "all" && e.status !== data.status) return false;
        if (data.service_type && data.service_type !== "all" && e.service_type !== data.service_type) return false;
        return true;
      });
  });

export const createAccountingEntry = createServerFn({ method: "POST" })
  .inputValidator(z.object({ service_type: z.enum(["tour", "transfer", "trip"]), amount: z.number(), payment_method: z.string().nullish(), status: z.enum(["paid", "pending", "refunded"]), entry_date: z.string(), notes: z.string().nullish(), booking_id: z.string().nullish(), customer_id: z.string().nullish() }))
  .handler(async ({ data }) => {
    await db.insert(accounting_entries).values({ ...data, amount: String(data.amount), entry_date: data.entry_date as any } as any);
    return { success: true };
  });

export const updateAccountingEntry = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), status: z.enum(["paid", "pending", "refunded"]).optional(), amount: z.number().optional(), payment_method: z.string().nullish(), notes: z.string().nullish() }))
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    const patch: any = { ...rest };
    if (rest.amount !== undefined) patch.amount = String(rest.amount);
    await db.update(accounting_entries).set(patch).where(eq(accounting_entries.id, id));
    return { success: true };
  });

export const getAccountingSummary = createServerFn({ method: "GET" }).handler(async () => {
  const entries = await db.select({ amount: accounting_entries.amount, status: accounting_entries.status }).from(accounting_entries);
  return {
    totalRevenue: entries.filter((e) => e.status === "paid").reduce((s, e) => s + normalizeDecimal(e.amount), 0),
    unpaidAmount: entries.filter((e) => e.status === "pending").reduce((s, e) => s + normalizeDecimal(e.amount), 0),
    totalEntries: entries.length,
  };
});

// ── Dashboard calendar ───────────────────────────────────────────────────────

export const getAllSchedules = createServerFn({ method: "GET" }).handler(async () => {
  const [tourRows, transferRows, tripRows] = await Promise.all([
    db.query.scheduled_tours.findMany({ with: { tour: { columns: { name: true } } } }),
    db.query.scheduled_transfers.findMany({ with: { transfer: { columns: { name: true } } } }),
    db.select({ id: trips.id, trip_date: trips.trip_date, pickup_time: trips.pickup_time, status: trips.status, title: trips.title }).from(trips),
  ]);
  return [
    ...tourRows.map((r) => ({ id: r.id, kind: "tour" as const, date: normalizeDate(r.service_date as any) ?? "", time: normalizeTime(r.departure_time as any), name: r.tour?.name ?? "Tour", status: r.status, parentId: r.tour_id })),
    ...transferRows.map((r) => ({ id: r.id, kind: "transfer" as const, date: normalizeDate(r.service_date as any) ?? "", time: normalizeTime(r.pickup_time as any), name: r.transfer?.name ?? "Transfer", status: r.status, parentId: r.transfer_id })),
    ...tripRows.map((r) => ({ id: r.id, kind: "trip" as const, date: normalizeDate(r.trip_date as any) ?? "", time: normalizeTime(r.pickup_time as any), name: r.title, status: r.status, parentId: r.id })),
  ];
});

// ── Settings ─────────────────────────────────────────────────────────────────

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const [row] = await db.select().from(agency_settings).limit(1);
  return row ? { ...row, created_at: String(row.created_at), updated_at: String(row.updated_at) } : null;
});

export const upsertSettings = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    agency_name: z.string().optional(), contact_email: z.string().optional(),
    support_phone: z.string().nullish(), address: z.string().nullish(),
    website: z.string().nullish(), currency: z.string().optional(),
    timezone: z.string().optional(), voucher_footer: z.string().nullish(),
    voucher_show_qr: z.boolean().optional(), voucher_auto_email: z.boolean().optional(),
    voucher_signature_line: z.boolean().optional(), email_from_name: z.string().nullish(),
    email_reply_to: z.string().nullish(), resend_api_key: z.string().nullish(),
  }))
  .handler(async ({ data }) => {
    const [existing] = await db.select({ id: agency_settings.id }).from(agency_settings).limit(1);
    if (existing) {
      await db.update(agency_settings).set(data as any).where(eq(agency_settings.id, existing.id));
    } else {
      await db.insert(agency_settings).values(data as any);
    }
    return { success: true };
  });
