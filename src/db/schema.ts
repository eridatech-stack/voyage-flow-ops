import {
  mysqlTable, varchar, text, boolean, int,
  decimal, date, time, timestamp, mysqlEnum,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const id = () => varchar("id", { length: 128 }).$defaultFn(() => createId());
const now = () => timestamp("created_at").notNull().defaultNow();

// ── Users (app operators) ────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id:           varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  email:        varchar("email", { length: 255 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  full_name:    varchar("full_name", { length: 255 }),
  created_at:   now(),
});

// ── Agency Settings ──────────────────────────────────────────────────────────

export const agency_settings = mysqlTable("agency_settings", {
  id:                    varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  agency_name:           varchar("agency_name", { length: 255 }).notNull().default("InTravelSync"),
  contact_email:         varchar("contact_email", { length: 255 }).notNull().default("ops@intravelsync.com"),
  support_phone:         varchar("support_phone", { length: 50 }),
  address:               text("address"),
  website:               varchar("website", { length: 255 }),
  currency:              varchar("currency", { length: 10 }).notNull().default("USD"),
  timezone:              varchar("timezone", { length: 50 }).notNull().default("Asia/Yerevan"),
  voucher_footer:        text("voucher_footer"),
  voucher_show_qr:       boolean("voucher_show_qr").notNull().default(true),
  voucher_auto_email:    boolean("voucher_auto_email").notNull().default(true),
  voucher_signature_line: boolean("voucher_signature_line").notNull().default(false),
  email_from_name:       varchar("email_from_name", { length: 255 }),
  email_reply_to:        varchar("email_reply_to", { length: 255 }),
  resend_api_key:        varchar("resend_api_key", { length: 255 }),
  created_at:            now(),
  updated_at:            timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// ── Vehicles ─────────────────────────────────────────────────────────────────

export const vehicles = mysqlTable("vehicles", {
  id:           varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  name:         varchar("name", { length: 255 }).notNull(),
  type:         mysqlEnum("type", ["van", "bus", "sedan", "minibus"]).notNull(),
  plate_number: varchar("plate_number", { length: 50 }).notNull(),
  capacity:     int("capacity").notNull(),
  status:       mysqlEnum("status", ["available", "on_trip", "maintenance"]).notNull().default("available"),
  created_at:   now(),
});

// ── Drivers ──────────────────────────────────────────────────────────────────

export const drivers = mysqlTable("drivers", {
  id:           varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  full_name:    varchar("full_name", { length: 255 }).notNull(),
  phone:        varchar("phone", { length: 50 }),
  license_type: varchar("license_type", { length: 100 }),
  status:       mysqlEnum("status", ["available", "on_trip", "off_duty"]).notNull().default("available"),
  vehicle_id:   varchar("vehicle_id", { length: 128 }).references(() => vehicles.id, { onDelete: "set null" }),
  created_at:   now(),
});

// ── Tours ────────────────────────────────────────────────────────────────────

export const tours = mysqlTable("tours", {
  id:          varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  name:        varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  duration:    varchar("duration", { length: 100 }),
  destination: varchar("destination", { length: 255 }),
  base_price:  decimal("base_price", { precision: 10, scale: 2 }).notNull().default("0"),
  is_active:   boolean("is_active").notNull().default(true),
  created_at:  now(),
});

// ── Transfers ────────────────────────────────────────────────────────────────

export const transfers = mysqlTable("transfers", {
  id:          varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  name:        varchar("name", { length: 255 }).notNull(),
  origin:      varchar("origin", { length: 255 }),
  destination: varchar("destination", { length: 255 }),
  base_price:  decimal("base_price", { precision: 10, scale: 2 }).notNull().default("0"),
  is_active:   boolean("is_active").notNull().default(true),
  created_at:  now(),
});

// ── Scheduled Tours ──────────────────────────────────────────────────────────

export const scheduled_tours = mysqlTable("scheduled_tours", {
  id:             varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  tour_id:        varchar("tour_id", { length: 128 }).notNull().references(() => tours.id, { onDelete: "cascade" }),
  service_date:   date("service_date").notNull(),
  departure_time: time("departure_time"),
  guide_name:     varchar("guide_name", { length: 255 }),
  vehicle_id:     varchar("vehicle_id", { length: 128 }).references(() => vehicles.id, { onDelete: "set null" }),
  driver_id:      varchar("driver_id", { length: 128 }).references(() => drivers.id, { onDelete: "set null" }),
  max_capacity:   int("max_capacity").notNull().default(0),
  status:         mysqlEnum("status", ["confirmed", "pending", "cancelled"]).notNull().default("pending"),
  notes:          text("notes"),
  created_at:     now(),
});

// ── Scheduled Transfers ──────────────────────────────────────────────────────

export const scheduled_transfers = mysqlTable("scheduled_transfers", {
  id:               varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  transfer_id:      varchar("transfer_id", { length: 128 }).notNull().references(() => transfers.id, { onDelete: "cascade" }),
  service_date:     date("service_date").notNull(),
  pickup_time:      time("pickup_time"),
  pickup_location:  varchar("pickup_location", { length: 255 }),
  dropoff_location: varchar("dropoff_location", { length: 255 }),
  driver_id:        varchar("driver_id", { length: 128 }).references(() => drivers.id, { onDelete: "set null" }),
  vehicle_id:       varchar("vehicle_id", { length: 128 }).references(() => vehicles.id, { onDelete: "set null" }),
  status:           mysqlEnum("status", ["confirmed", "pending", "cancelled"]).notNull().default("pending"),
  notes:            text("notes"),
  created_at:       now(),
});

// ── Trips ────────────────────────────────────────────────────────────────────

export const trips = mysqlTable("trips", {
  id:               varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  title:            varchar("title", { length: 255 }).notNull(),
  description:      text("description"),
  trip_date:        date("trip_date").notNull(),
  pickup_time:      time("pickup_time"),
  pickup_location:  varchar("pickup_location", { length: 255 }),
  dropoff_location: varchar("dropoff_location", { length: 255 }),
  vehicle_id:       varchar("vehicle_id", { length: 128 }).references(() => vehicles.id, { onDelete: "set null" }),
  driver_id:        varchar("driver_id", { length: 128 }).references(() => drivers.id, { onDelete: "set null" }),
  status:           mysqlEnum("status", ["confirmed", "pending", "cancelled", "completed"]).notNull().default("pending"),
  base_price:       decimal("base_price", { precision: 10, scale: 2 }).notNull().default("0"),
  notes:            text("notes"),
  created_at:       now(),
});

// ── Customers ────────────────────────────────────────────────────────────────

export const customers = mysqlTable("customers", {
  id:               varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  full_name:        varchar("full_name", { length: 255 }).notNull(),
  email:            varchar("email", { length: 255 }),
  phone:            varchar("phone", { length: 50 }),
  booking_reference: varchar("booking_reference", { length: 100 }),
  special_requests: text("special_requests"),
  payment_status:   mysqlEnum("payment_status", ["paid", "pending", "refunded"]).notNull().default("pending"),
  created_at:       now(),
});

// ── Tour Bookings ────────────────────────────────────────────────────────────

export const tour_bookings = mysqlTable("tour_bookings", {
  id:                varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  scheduled_tour_id: varchar("scheduled_tour_id", { length: 128 }).notNull().references(() => scheduled_tours.id, { onDelete: "cascade" }),
  customer_id:       varchar("customer_id", { length: 128 }).notNull().references(() => customers.id, { onDelete: "cascade" }),
  seat_count:        int("seat_count").notNull().default(1),
  voucher_status:    mysqlEnum("voucher_status", ["pending", "generated"]).notNull().default("pending"),
  amount:            decimal("amount", { precision: 10, scale: 2 }),
  notes:             text("notes"),
  created_at:        now(),
});

// ── Transfer Bookings ────────────────────────────────────────────────────────

export const transfer_bookings = mysqlTable("transfer_bookings", {
  id:                    varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  scheduled_transfer_id: varchar("scheduled_transfer_id", { length: 128 }).notNull().references(() => scheduled_transfers.id, { onDelete: "cascade" }),
  customer_id:           varchar("customer_id", { length: 128 }).notNull().references(() => customers.id, { onDelete: "cascade" }),
  passenger_count:       int("passenger_count").notNull().default(1),
  luggage_count:         int("luggage_count").notNull().default(0),
  flight_number:         varchar("flight_number", { length: 50 }),
  flight_time:           varchar("flight_time", { length: 50 }),
  voucher_status:        mysqlEnum("voucher_status", ["pending", "generated"]).notNull().default("pending"),
  amount:                decimal("amount", { precision: 10, scale: 2 }),
  notes:                 text("notes"),
  created_at:            now(),
});

// ── Trip Bookings ─────────────────────────────────────────────────────────────

export const trip_bookings = mysqlTable("trip_bookings", {
  id:              varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  trip_id:         varchar("trip_id", { length: 128 }).notNull().references(() => trips.id, { onDelete: "cascade" }),
  customer_id:     varchar("customer_id", { length: 128 }).notNull().references(() => customers.id, { onDelete: "cascade" }),
  passenger_count: int("passenger_count").notNull().default(1),
  luggage_count:   int("luggage_count").notNull().default(0),
  flight_number:   varchar("flight_number", { length: 50 }),
  flight_time:     varchar("flight_time", { length: 50 }),
  voucher_status:  mysqlEnum("voucher_status", ["pending", "generated"]).notNull().default("pending"),
  amount:          decimal("amount", { precision: 10, scale: 2 }),
  notes:           text("notes"),
  created_at:      now(),
});

// ── Accounting Entries ───────────────────────────────────────────────────────

export const accounting_entries = mysqlTable("accounting_entries", {
  id:             varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  service_type:   mysqlEnum("service_type", ["tour", "transfer", "trip"]).notNull(),
  booking_id:     varchar("booking_id", { length: 128 }),
  customer_id:    varchar("customer_id", { length: 128 }).references(() => customers.id, { onDelete: "set null" }),
  amount:         decimal("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  payment_method: varchar("payment_method", { length: 50 }),
  status:         mysqlEnum("status", ["paid", "pending", "refunded"]).notNull().default("pending"),
  entry_date:     date("entry_date").notNull(),
  notes:          text("notes"),
  created_at:     now(),
});

// ── Relations ────────────────────────────────────────────────────────────────

export const toursRelations = relations(tours, ({ many }) => ({
  scheduled_tours: many(scheduled_tours),
}));

export const transfersRelations = relations(transfers, ({ many }) => ({
  scheduled_transfers: many(scheduled_transfers),
}));

export const vehiclesRelations = relations(vehicles, ({ many, one }) => ({
  driver: one(drivers, { fields: [vehicles.id], references: [drivers.vehicle_id] }),
  scheduled_tours: many(scheduled_tours),
  scheduled_transfers: many(scheduled_transfers),
  trips: many(trips),
}));

export const driversRelations = relations(drivers, ({ one }) => ({
  vehicle: one(vehicles, { fields: [drivers.vehicle_id], references: [vehicles.id] }),
}));

export const scheduledToursRelations = relations(scheduled_tours, ({ one, many }) => ({
  tour: one(tours, { fields: [scheduled_tours.tour_id], references: [tours.id] }),
  vehicle: one(vehicles, { fields: [scheduled_tours.vehicle_id], references: [vehicles.id] }),
  driver: one(drivers, { fields: [scheduled_tours.driver_id], references: [drivers.id] }),
  bookings: many(tour_bookings),
}));

export const scheduledTransfersRelations = relations(scheduled_transfers, ({ one, many }) => ({
  transfer: one(transfers, { fields: [scheduled_transfers.transfer_id], references: [transfers.id] }),
  vehicle: one(vehicles, { fields: [scheduled_transfers.vehicle_id], references: [vehicles.id] }),
  driver: one(drivers, { fields: [scheduled_transfers.driver_id], references: [drivers.id] }),
  bookings: many(transfer_bookings),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  vehicle: one(vehicles, { fields: [trips.vehicle_id], references: [vehicles.id] }),
  driver: one(drivers, { fields: [trips.driver_id], references: [drivers.id] }),
  bookings: many(trip_bookings),
}));

export const tourBookingsRelations = relations(tour_bookings, ({ one }) => ({
  scheduled_tour: one(scheduled_tours, { fields: [tour_bookings.scheduled_tour_id], references: [scheduled_tours.id] }),
  customer: one(customers, { fields: [tour_bookings.customer_id], references: [customers.id] }),
}));

export const transferBookingsRelations = relations(transfer_bookings, ({ one }) => ({
  scheduled_transfer: one(scheduled_transfers, { fields: [transfer_bookings.scheduled_transfer_id], references: [scheduled_transfers.id] }),
  customer: one(customers, { fields: [transfer_bookings.customer_id], references: [customers.id] }),
}));

export const tripBookingsRelations = relations(trip_bookings, ({ one }) => ({
  trip: one(trips, { fields: [trip_bookings.trip_id], references: [trips.id] }),
  customer: one(customers, { fields: [trip_bookings.customer_id], references: [customers.id] }),
}));

export const accountingRelations = relations(accounting_entries, ({ one }) => ({
  customer: one(customers, { fields: [accounting_entries.customer_id], references: [customers.id] }),
}));
