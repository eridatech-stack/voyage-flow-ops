import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  booking_reference: string | null;
  special_requests: string | null;
  payment_status: "paid" | "pending" | "refunded";
  created_at: string;
}

export interface TourBooking {
  id: string;
  scheduled_tour_id: string;
  customer_id: string;
  seat_count: number;
  voucher_status: "pending" | "generated";
  notes: string | null;
  created_at: string;
  customer: Customer;
}

export interface TransferBooking {
  id: string;
  scheduled_transfer_id: string;
  customer_id: string;
  passenger_count: number;
  luggage_count: number;
  flight_number: string | null;
  flight_time: string | null;
  voucher_status: "pending" | "generated";
  notes: string | null;
  created_at: string;
  customer: Customer;
}

// ── Tour Bookings ───────────────────────────────────────────────────────────

export function useTourBookings(scheduledTourId: string) {
  return useQuery({
    queryKey: ["tour_bookings", scheduledTourId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tour_bookings")
        .select(`*, customer:customers(*)`)
        .eq("scheduled_tour_id", scheduledTourId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TourBooking[];
    },
    enabled: !!scheduledTourId,
  });
}

export interface AddTourBookingInput {
  scheduled_tour_id: string;
  seat_count: number;
  notes?: string;
  // customer fields
  full_name: string;
  email?: string;
  phone?: string;
  booking_reference?: string;
  special_requests?: string;
  payment_status: "paid" | "pending" | "refunded";
}

export function useAddTourBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddTourBookingInput) => {
      // 1. Create or upsert the customer
      const { data: customer, error: cErr } = await supabase
        .from("customers")
        .insert({
          full_name: input.full_name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          booking_reference: input.booking_reference ?? `BK-${Date.now().toString().slice(-6)}`,
          special_requests: input.special_requests ?? null,
          payment_status: input.payment_status,
        })
        .select()
        .single();
      if (cErr) throw cErr;

      // 2. Create the booking
      const { data: booking, error: bErr } = await supabase
        .from("tour_bookings")
        .insert({
          scheduled_tour_id: input.scheduled_tour_id,
          customer_id: customer.id,
          seat_count: input.seat_count,
          notes: input.notes ?? null,
          voucher_status: "pending",
        })
        .select()
        .single();
      if (bErr) throw bErr;

      return booking;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tour_bookings", vars.scheduled_tour_id] });
      qc.invalidateQueries({ queryKey: ["scheduled_tours"] });
      toast.success("Customer added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTourBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      scheduledTourId,
      customerId,
      customerUpdate,
      bookingUpdate,
    }: {
      bookingId: string;
      scheduledTourId: string;
      customerId: string;
      customerUpdate?: Partial<Omit<Customer, "id" | "created_at">>;
      bookingUpdate?: { seat_count?: number; notes?: string; voucher_status?: "pending" | "generated" };
    }) => {
      if (customerUpdate) {
        const { error } = await supabase
          .from("customers")
          .update(customerUpdate)
          .eq("id", customerId);
        if (error) throw error;
      }
      if (bookingUpdate) {
        const { error } = await supabase
          .from("tour_bookings")
          .update(bookingUpdate)
          .eq("id", bookingId);
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tour_bookings", vars.scheduledTourId] });
      toast.success("Booking updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGenerateTourVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, scheduledTourId }: { bookingId: string; scheduledTourId: string }) => {
      const { error } = await supabase
        .from("tour_bookings")
        .update({ voucher_status: "generated" })
        .eq("id", bookingId);
      if (error) throw error;
      return { bookingId, scheduledTourId };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tour_bookings", vars.scheduledTourId] });
      toast.success("Voucher generated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGenerateAllTourVouchers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scheduledTourId: string) => {
      const { error } = await supabase
        .from("tour_bookings")
        .update({ voucher_status: "generated" })
        .eq("scheduled_tour_id", scheduledTourId);
      if (error) throw error;
    },
    onSuccess: (_data, scheduledTourId) => {
      qc.invalidateQueries({ queryKey: ["tour_bookings", scheduledTourId] });
      toast.success("All vouchers generated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveTourBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, scheduledTourId }: { bookingId: string; scheduledTourId: string }) => {
      const { error } = await supabase
        .from("tour_bookings")
        .delete()
        .eq("id", bookingId);
      if (error) throw error;
      return scheduledTourId;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tour_bookings", vars.scheduledTourId] });
      qc.invalidateQueries({ queryKey: ["scheduled_tours"] });
      toast.success("Customer removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Transfer Bookings ───────────────────────────────────────────────────────

export function useTransferBookings(scheduledTransferId: string) {
  return useQuery({
    queryKey: ["transfer_bookings", scheduledTransferId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfer_bookings")
        .select(`*, customer:customers(*)`)
        .eq("scheduled_transfer_id", scheduledTransferId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TransferBooking[];
    },
    enabled: !!scheduledTransferId,
  });
}

export interface AddTransferBookingInput {
  scheduled_transfer_id: string;
  passenger_count: number;
  luggage_count: number;
  flight_number?: string;
  flight_time?: string;
  notes?: string;
  // customer fields
  full_name: string;
  email?: string;
  phone?: string;
  booking_reference?: string;
  special_requests?: string;
  payment_status: "paid" | "pending" | "refunded";
}

export function useAddTransferBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddTransferBookingInput) => {
      const { data: customer, error: cErr } = await supabase
        .from("customers")
        .insert({
          full_name: input.full_name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          booking_reference: input.booking_reference ?? `BK-${Date.now().toString().slice(-6)}`,
          special_requests: input.special_requests ?? null,
          payment_status: input.payment_status,
        })
        .select()
        .single();
      if (cErr) throw cErr;

      const { data: booking, error: bErr } = await supabase
        .from("transfer_bookings")
        .insert({
          scheduled_transfer_id: input.scheduled_transfer_id,
          customer_id: customer.id,
          passenger_count: input.passenger_count,
          luggage_count: input.luggage_count,
          flight_number: input.flight_number ?? null,
          flight_time: input.flight_time ?? null,
          notes: input.notes ?? null,
          voucher_status: "pending",
        })
        .select()
        .single();
      if (bErr) throw bErr;

      return booking;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["transfer_bookings", vars.scheduled_transfer_id] });
      qc.invalidateQueries({ queryKey: ["scheduled_transfers"] });
      toast.success("Customer added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGenerateTransferVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, scheduledTransferId }: { bookingId: string; scheduledTransferId: string }) => {
      const { error } = await supabase
        .from("transfer_bookings")
        .update({ voucher_status: "generated" })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["transfer_bookings", vars.scheduledTransferId] });
      toast.success("Voucher generated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGenerateAllTransferVouchers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scheduledTransferId: string) => {
      const { error } = await supabase
        .from("transfer_bookings")
        .update({ voucher_status: "generated" })
        .eq("scheduled_transfer_id", scheduledTransferId);
      if (error) throw error;
    },
    onSuccess: (_data, scheduledTransferId) => {
      qc.invalidateQueries({ queryKey: ["transfer_bookings", scheduledTransferId] });
      toast.success("All vouchers generated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveTransferBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, scheduledTransferId }: { bookingId: string; scheduledTransferId: string }) => {
      const { error } = await supabase
        .from("transfer_bookings")
        .delete()
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["transfer_bookings", vars.scheduledTransferId] });
      qc.invalidateQueries({ queryKey: ["scheduled_transfers"] });
      toast.success("Customer removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
