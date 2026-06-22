import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────────────────────

export interface Trip {
  id: string;
  title: string;
  description: string | null;
  trip_date: string;
  pickup_time: string | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  vehicle_id: string | null;
  driver_id: string | null;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  base_price: number;
  notes: string | null;
  created_at: string;
  // joined
  vehicle?: { name: string; plate_number: string; capacity: number } | null;
  driver?: { full_name: string } | null;
  booking_count?: number;
  total_passengers?: number;
}

export interface TripBooking {
  id: string;
  trip_id: string;
  customer_id: string;
  passenger_count: number;
  luggage_count: number;
  flight_number: string | null;
  flight_time: string | null;
  voucher_status: "pending" | "generated";
  amount: number | null;
  notes: string | null;
  created_at: string;
  customer: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    booking_reference: string | null;
    special_requests: string | null;
    payment_status: "paid" | "pending" | "refunded";
  };
}

export type TripInsert = Omit<Trip, "id" | "created_at" | "vehicle" | "driver" | "booking_count" | "total_passengers">;
export type TripUpdate = Partial<TripInsert>;

// ── Fetch all trips ─────────────────────────────────────────────────────────

export function useTrips() {
  return useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          vehicle:vehicles(name, plate_number, capacity),
          driver:drivers(full_name),
          trip_bookings(id, passenger_count)
        `)
        .order("trip_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...row,
        booking_count: row.trip_bookings?.length ?? 0,
        total_passengers: (row.trip_bookings ?? []).reduce(
          (sum: number, b: any) => sum + (b.passenger_count ?? 1), 0
        ),
        trip_bookings: undefined,
      })) as unknown as Trip[];
    },
  });
}

// ── Fetch single trip ───────────────────────────────────────────────────────

export function useTrip(id: string) {
  return useQuery({
    queryKey: ["trips", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          vehicle:vehicles(name, plate_number, capacity),
          driver:drivers(full_name)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as Trip;
    },
    enabled: !!id,
  });
}

// ── Create trip ─────────────────────────────────────────────────────────────

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (trip: TripInsert) => {
      const { data, error } = await supabase
        .from("trips").insert(trip).select().single();
      if (error) throw error;
      return data as unknown as Trip;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Trip created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Update trip ─────────────────────────────────────────────────────────────

export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: TripUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("trips").update(update).eq("id", id).select().single();
      if (error) throw error;
      return data as unknown as Trip;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["trips", vars.id] });
      toast.success("Trip updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Delete trip ─────────────────────────────────────────────────────────────

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Trip deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Trip bookings ───────────────────────────────────────────────────────────

export function useTripBookings(tripId: string) {
  return useQuery({
    queryKey: ["trip_bookings", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_bookings")
        .select(`*, customer:customers(*)`)
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as TripBooking[];
    },
    enabled: !!tripId,
  });
}

export interface AddTripBookingInput {
  trip_id: string;
  passenger_count: number;
  luggage_count: number;
  flight_number?: string;
  flight_time?: string;
  amount?: number;
  notes?: string;
  full_name: string;
  email?: string;
  phone?: string;
  booking_reference?: string;
  special_requests?: string;
  payment_status: "paid" | "pending" | "refunded";
}

export function useAddTripBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddTripBookingInput) => {
      const { data: customer, error: cErr } = await supabase
        .from("customers")
        .insert({
          full_name: input.full_name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          booking_reference: input.booking_reference ?? `TR-${Date.now().toString().slice(-6)}`,
          special_requests: input.special_requests ?? null,
          payment_status: input.payment_status,
        })
        .select().single();
      if (cErr) throw cErr;

      const { data: booking, error: bErr } = await supabase
        .from("trip_bookings")
        .insert({
          trip_id: input.trip_id,
          customer_id: customer.id,
          passenger_count: input.passenger_count,
          luggage_count: input.luggage_count,
          flight_number: input.flight_number ?? null,
          flight_time: input.flight_time ?? null,
          amount: input.amount ?? null,
          notes: input.notes ?? null,
          voucher_status: "pending",
        })
        .select().single();
      if (bErr) throw bErr;
      return booking;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["trip_bookings", vars.trip_id] });
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Customer added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGenerateTripVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, tripId }: { bookingId: string; tripId: string }) => {
      const { error } = await supabase
        .from("trip_bookings")
        .update({ voucher_status: "generated" })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["trip_bookings", vars.tripId] });
      toast.success("Voucher generated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveTripBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, tripId }: { bookingId: string; tripId: string }) => {
      const { error } = await supabase.from("trip_bookings").delete().eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["trip_bookings", vars.tripId] });
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Customer removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
