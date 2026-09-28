import { normalizeDate, normalizeTime, normalizeDecimal } from "@/lib/normalize";
"use server";

import { db } from "@/db/client";
import {
  transfers, scheduled_transfers, transfer_bookings,
  trips, trip_bookings,
  vehicles, drivers,
  customers, accounting_entries, agency_settings,
} from "@/db/schema";
import { eq, desc, asc, and, gte, lte } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// ── Transfers ────────────────────────────────────────────────────────────────

export async function getTransfers() {
  const rows = await db.select().from(transfers).where(eq(transfers.is_active, true)).orderBy(desc(transfers.created_at));
  return rows.map((r) => ({ ...r, base_price: normalizeDecimal(r.base_price) }));
}

export async function getTransfer(id: string) {
  const [row] = await db.select().from(transfers).where(eq(transfers.id, id)).limit(1);
  if (!row) return null;
  return { ...row, base_price: normalizeDecimal(row.base_price) };
}

export async function createTransfer(data: { name: string; origin?: string | null; destination?: string | null; base_price: number }) {
  await db.insert(transfers).values({ ...data, base_price: String(data.base_price), is_active: true });
  return { success: true };
}

export async function updateTransfer(id: string, data: Partial<{ name: string; origin: string | null; destination: string | null; base_price: number; is_active: boolean }>) {
  const patch: any = { ...data };
  if (data.base_price !== undefined) patch.base_price = String(data.base_price);
  await db.update(transfers).set(patch).where(eq(transfers.id, id));
  return { success: true };
}

export async function archiveTransfer(id: string) {
  await db.update(transfers).set({ is_active: false }).where(eq(transfers.id, id));
  return { success: true };
}

// ── Scheduled Transfers ──────────────────────────────────────────────────────

export async function getScheduledTransfers(transferId?: string) {
  const rows = await db.query.scheduled_transfers.findMany({
    where: transferId ? eq(scheduled_transfers.transfer_id, transferId) : undefined,
    with: {
      transfer: { columns: { name: true, origin: true, destination: true } },
      vehicle: { columns: { name: true, plate_number: true } },
      driver: { columns: { full_name: true } },
      bookings: { columns: { id: true, passenger_count: true } },
    },
    orderBy: [asc(scheduled_transfers.service_date)],
  });
  return rows.map((r) => ({ ...r, service_date: normalizeDate(r.service_date as any) ?? "", pickup_time: normalizeTime(r.pickup_time as any), booking_count: r.bookings.length, bookings: undefined }));
}

export async function getScheduledTransfer(id: string) {
  const row = await db.query.scheduled_transfers.findFirst({
    where: eq(scheduled_transfers.id, id),
    with: {
      transfer: { columns: { name: true, origin: true, destination: true } },
      vehicle: { columns: { name: true, plate_number: true } },
      driver: { columns: { full_name: true } },
    },
  });
  if (!row) return undefined;
  return { ...row, service_date: normalizeDate(row.service_date as any) ?? "", pickup_time: normalizeTime(row.pickup_time as any) };
}

export async function createScheduledTransfer(data: { transfer_id: string; service_date: string; pickup_time?: string | null; pickup_location?: string | null; dropoff_location?: string | null; driver_id?: string | null; vehicle_id?: string | null; status: string; notes?: string | null }) {
  await db.insert(scheduled_transfers).values(data as any);
  return { success: true };
}

export async function updateScheduledTransfer(id: string, data: any) {
  await db.update(scheduled_transfers).set(data).where(eq(scheduled_transfers.id, id));
  return { success: true };
}

export async function getTransferBookings(scheduledTransferId: string) {
  return db.query.transfer_bookings.findMany({
    where: eq(transfer_bookings.scheduled_transfer_id, scheduledTransferId),
    with: { customer: true },
    orderBy: [asc(transfer_bookings.created_at)],
  });
}

export async function addTransferBooking(input: { scheduled_transfer_id: string; passenger_count: number; luggage_count: number; flight_number?: string; flight_time?: string; amount?: number; payment_method?: string; notes?: string; full_name: string; email?: string; phone?: string; booking_reference?: string; special_requests?: string; payment_status: "paid" | "pending" | "refunded" }) {
  const customerId = createId();
  await db.insert(customers).values({ id: customerId, full_name: input.full_name, email: input.email ?? null, phone: input.phone ?? null, booking_reference: input.booking_reference ?? `BK-${Date.now().toString().slice(-6)}`, special_requests: input.special_requests ?? null, payment_status: input.payment_status });
  const bookingId = createId();
  await db.insert(transfer_bookings).values({ id: bookingId, scheduled_transfer_id: input.scheduled_transfer_id, customer_id: customerId, passenger_count: input.passenger_count, luggage_count: input.luggage_count, flight_number: input.flight_number ?? null, flight_time: input.flight_time ?? null, amount: input.amount ? String(input.amount) : null, notes: input.notes ?? null, voucher_status: "pending" });
  await db.insert(accounting_entries).values({ service_type: "transfer", booking_id: bookingId, customer_id: customerId, amount: String(input.amount ?? 0), payment_method: input.payment_method ?? null, status: input.payment_status === "paid" ? "paid" : "pending", entry_date: new Date().toISOString().slice(0, 10) as any, notes: `Transfer booking: ${input.booking_reference ?? bookingId.slice(0, 8)}` });
  return { success: true };
}

export async function generateTransferVoucher(bookingId: string) {
  await db.update(transfer_bookings).set({ voucher_status: "generated" }).where(eq(transfer_bookings.id, bookingId));
  return { success: true };
}

export async function generateAllTransferVouchers(scheduledTransferId: string) {
  await db.update(transfer_bookings).set({ voucher_status: "generated" }).where(eq(transfer_bookings.scheduled_transfer_id, scheduledTransferId));
  return { success: true };
}

export async function removeTransferBooking(bookingId: string) {
  await db.delete(transfer_bookings).where(eq(transfer_bookings.id, bookingId));
  return { success: true };
}

// ── Trips ────────────────────────────────────────────────────────────────────

export async function getTrips() {
  const rows = await db.query.trips.findMany({
    with: { vehicle: { columns: { name: true, plate_number: true, capacity: true } }, driver: { columns: { full_name: true } }, bookings: { columns: { id: true, passenger_count: true } } },
    orderBy: [desc(trips.trip_date)],
  });
  return rows.map((r) => ({ ...r, trip_date: normalizeDate(r.trip_date as any) ?? "", pickup_time: normalizeTime(r.pickup_time as any), base_price: normalizeDecimal(r.base_price), booking_count: r.bookings.length, total_passengers: r.bookings.reduce((s, b) => s + b.passenger_count, 0), bookings: undefined }));
}

export async function getTrip(id: string) {
  const t = await db.query.trips.findFirst({ where: eq(trips.id, id), with: { vehicle: { columns: { name: true, plate_number: true, capacity: true } }, driver: { columns: { full_name: true } } } });
  if (!t) return undefined;
  return { ...t, trip_date: normalizeDate(t.trip_date as any) ?? "", pickup_time: normalizeTime(t.pickup_time as any), base_price: normalizeDecimal(t.base_price) };
}

export async function createTrip(data: { title: string; description?: string | null; trip_date: string; pickup_time?: string | null; pickup_location?: string | null; dropoff_location?: string | null; vehicle_id?: string | null; driver_id?: string | null; status: string; base_price: number; notes?: string | null }) {
  await db.insert(trips).values({ ...data, base_price: String(data.base_price) } as any);
  return { success: true };
}

export async function updateTrip(id: string, data: any) {
  const patch = { ...data };
  if (data.base_price !== undefined) patch.base_price = String(data.base_price);
  await db.update(trips).set(patch).where(eq(trips.id, id));
  return { success: true };
}

export async function deleteTrip(id: string) {
  await db.delete(trips).where(eq(trips.id, id));
  return { success: true };
}

export async function getTripBookings(tripId: string) {
  const rows = await db.query.trip_bookings.findMany({ where: eq(trip_bookings.trip_id, tripId), with: { customer: true }, orderBy: [asc(trip_bookings.created_at)] });
  return rows.map((r) => ({ ...r, amount: r.amount != null ? normalizeDecimal(r.amount) : null }));
}

export async function addTripBooking(input: { trip_id: string; passenger_count: number; luggage_count: number; flight_number?: string; flight_time?: string; amount?: number; notes?: string; full_name: string; email?: string; phone?: string; booking_reference?: string; special_requests?: string; payment_status: "paid" | "pending" | "refunded" }) {
  const customerId = createId();
  await db.insert(customers).values({ id: customerId, full_name: input.full_name, email: input.email ?? null, phone: input.phone ?? null, booking_reference: input.booking_reference ?? `TR-${Date.now().toString().slice(-6)}`, special_requests: input.special_requests ?? null, payment_status: input.payment_status });
  const bookingId = createId();
  await db.insert(trip_bookings).values({ id: bookingId, trip_id: input.trip_id, customer_id: customerId, passenger_count: input.passenger_count, luggage_count: input.luggage_count, flight_number: input.flight_number ?? null, flight_time: input.flight_time ?? null, amount: input.amount ? String(input.amount) : null, notes: input.notes ?? null, voucher_status: "pending" });
  await db.insert(accounting_entries).values({ service_type: "trip", booking_id: bookingId, customer_id: customerId, amount: String(input.amount ?? 0), payment_method: null, status: input.payment_status === "paid" ? "paid" : "pending", entry_date: new Date().toISOString().slice(0, 10) as any, notes: `Trip: ${input.booking_reference ?? bookingId.slice(0, 8)}` });
  return { success: true };
}

export async function updateTripBooking(input: { bookingId: string; customerId: string; tripId?: string; customerUpdate?: any; bookingUpdate?: any }) {
  if (input.customerUpdate) await db.update(customers).set(input.customerUpdate).where(eq(customers.id, input.customerId));
  if (input.bookingUpdate) await db.update(trip_bookings).set(input.bookingUpdate).where(eq(trip_bookings.id, input.bookingId));
  return { success: true };
}

export async function generateTripVoucher(bookingId: string) {
  await db.update(trip_bookings).set({ voucher_status: "generated" }).where(eq(trip_bookings.id, bookingId));
  return { success: true };
}

export async function removeTripBooking(bookingId: string) {
  await db.delete(trip_bookings).where(eq(trip_bookings.id, bookingId));
  return { success: true };
}

// ── Fleet ────────────────────────────────────────────────────────────────────

export async function getVehicles() {
  return db.select().from(vehicles).orderBy(asc(vehicles.name));
}

export async function createVehicle(data: { name: string; type: "van" | "bus" | "sedan" | "minibus"; plate_number: string; capacity: number; status: "available" | "on_trip" | "maintenance" }) {
  await db.insert(vehicles).values(data);
  return { success: true };
}

export async function updateVehicle(id: string, data: any) {
  await db.update(vehicles).set(data).where(eq(vehicles.id, id));
  return { success: true };
}

export async function getDrivers() {
  return db.query.drivers.findMany({ with: { vehicle: { columns: { name: true, plate_number: true } } }, orderBy: [asc(drivers.full_name)] });
}

export async function createDriver(data: { full_name: string; phone?: string | null; license_type?: string | null; status: "available" | "on_trip" | "off_duty"; vehicle_id?: string | null }) {
  await db.insert(drivers).values(data);
  return { success: true };
}

export async function updateDriver(id: string, data: any) {
  await db.update(drivers).set(data).where(eq(drivers.id, id));
  return { success: true };
}

// ── Accounting ───────────────────────────────────────────────────────────────

export async function getAccountingEntries(filters?: { from?: string; to?: string; status?: string; service_type?: string }) {
  const rows = await db.query.accounting_entries.findMany({
    with: { customer: { columns: { full_name: true } } },
    orderBy: [desc(accounting_entries.entry_date)],
  });
  const normalized = rows.map((r) => ({ ...r, amount: normalizeDecimal(r.amount), entry_date: normalizeDate(r.entry_date as any) ?? "" }));
  return normalized.filter((e) => {
    if (filters?.from && String(e.entry_date) < filters.from) return false;
    if (filters?.to && String(e.entry_date) > filters.to) return false;
    if (filters?.status && filters.status !== "all" && e.status !== filters.status) return false;
    if (filters?.service_type && filters.service_type !== "all" && e.service_type !== filters.service_type) return false;
    return true;
  });
}

export async function createAccountingEntry(data: { service_type: "tour" | "transfer" | "trip"; amount: number; payment_method?: string | null; status: "paid" | "pending" | "refunded"; entry_date: string; notes?: string | null; booking_id?: string | null; customer_id?: string | null }) {
  await db.insert(accounting_entries).values({ ...data, amount: String(data.amount) } as any);
  return { success: true };
}

export async function updateAccountingEntry(id: string, data: Partial<{ status: "paid" | "pending" | "refunded"; amount: number; payment_method: string | null; notes: string | null }>) {
  const patch: any = { ...data };
  if (data.amount !== undefined) patch.amount = String(data.amount);
  await db.update(accounting_entries).set(patch).where(eq(accounting_entries.id, id));
  return { success: true };
}

export async function getAccountingSummary() {
  const entries = await db.select({ amount: accounting_entries.amount, status: accounting_entries.status }).from(accounting_entries);
  const totalRevenue = entries.filter((e) => e.status === "paid").reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const unpaidAmount = entries.filter((e) => e.status === "pending").reduce((s, e) => s + Number(e.amount ?? 0), 0);
  return { totalRevenue, unpaidAmount, totalEntries: entries.length };
}

// ── All schedules for dashboard calendar ─────────────────────────────────────

export async function getAllSchedules() {
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
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings() {
  const [row] = await db.select().from(agency_settings).limit(1);
  return row ?? null;
}

export async function upsertSettings(data: Partial<typeof agency_settings.$inferInsert>) {
  const [existing] = await db.select({ id: agency_settings.id }).from(agency_settings).limit(1);
  if (existing) {
    await db.update(agency_settings).set(data).where(eq(agency_settings.id, existing.id));
  } else {
    await db.insert(agency_settings).values(data as any);
  }
  return { success: true };
}
