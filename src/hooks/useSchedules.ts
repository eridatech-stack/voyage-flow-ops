import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────────────────────

export interface ScheduledTour {
  id: string;
  tour_id: string;
  service_date: string;
  departure_time: string | null;
  guide_name: string | null;
  vehicle_id: string | null;
  driver_id: string | null;
  max_capacity: number;
  status: "confirmed" | "pending" | "cancelled";
  notes: string | null;
  created_at: string;
  // joined
  tour?: { name: string; destination: string | null; duration: string | null };
  vehicle?: { name: string; plate_number: string } | null;
  driver?: { full_name: string } | null;
  booking_count?: number;
  total_seats?: number; // sum of seat_count across all bookings
}

export interface ScheduledTransfer {
  id: string;
  transfer_id: string;
  service_date: string;
  pickup_time: string | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  driver_id: string | null;
  vehicle_id: string | null;
  status: "confirmed" | "pending" | "cancelled";
  notes: string | null;
  created_at: string;
  // joined
  transfer?: { name: string; origin: string | null; destination: string | null };
  driver?: { full_name: string } | null;
  vehicle?: { name: string; plate_number: string } | null;
  booking_count?: number;
}

export type ScheduledTourInsert = Omit<ScheduledTour, "id" | "created_at" | "tour" | "vehicle" | "driver" | "booking_count">;
export type ScheduledTourUpdate = Partial<ScheduledTourInsert>;

export type ScheduledTransferInsert = Omit<ScheduledTransfer, "id" | "created_at" | "transfer" | "driver" | "vehicle" | "booking_count">;
export type ScheduledTransferUpdate = Partial<ScheduledTransferInsert>;

// ── Scheduled Tours ─────────────────────────────────────────────────────────

export function useScheduledTours(tourId?: string) {
  return useQuery({
    queryKey: ["scheduled_tours", tourId],
    queryFn: async () => {
      let q = supabase
        .from("scheduled_tours")
        .select(`
          *,
          tour:tours(name, destination, duration),
          vehicle:vehicles(name, plate_number),
          driver:drivers(full_name),
          tour_bookings(id, seat_count)
        `)
        .order("service_date", { ascending: true });

      if (tourId) q = q.eq("tour_id", tourId);

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        ...row,
        booking_count: row.tour_bookings?.length ?? 0,
        total_seats: (row.tour_bookings ?? []).reduce((sum: number, b: any) => sum + (b.seat_count ?? 1), 0),
        tour_bookings: undefined,
      })) as ScheduledTour[];
    },
  });
}

export function useScheduledTour(id: string) {
  return useQuery({
    queryKey: ["scheduled_tours", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_tours")
        .select(`
          *,
          tour:tours(name, destination, duration),
          vehicle:vehicles(name, plate_number),
          driver:drivers(full_name)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as ScheduledTour;
    },
    enabled: !!id,
  });
}

export function useCreateScheduledTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: ScheduledTourInsert) => {
      const { data, error } = await supabase
        .from("scheduled_tours")
        .insert(s)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["scheduled_tours"] });
      qc.invalidateQueries({ queryKey: ["scheduled_tours", vars.tour_id] });
      toast.success("Schedule added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateScheduledTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: ScheduledTourUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("scheduled_tours")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scheduled_tours"] });
      toast.success("Schedule updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteScheduledTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scheduled_tours").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scheduled_tours"] });
      toast.success("Schedule deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Scheduled Transfers ─────────────────────────────────────────────────────

export function useScheduledTransfers(transferId?: string) {
  return useQuery({
    queryKey: ["scheduled_transfers", transferId],
    queryFn: async () => {
      let q = supabase
        .from("scheduled_transfers")
        .select(`
          *,
          transfer:transfers(name, origin, destination),
          driver:drivers(full_name),
          vehicle:vehicles(name, plate_number),
          transfer_bookings(id)
        `)
        .order("service_date", { ascending: true });

      if (transferId) q = q.eq("transfer_id", transferId);

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        ...row,
        booking_count: row.transfer_bookings?.length ?? 0,
        transfer_bookings: undefined,
      })) as ScheduledTransfer[];
    },
  });
}

export function useScheduledTransfer(id: string) {
  return useQuery({
    queryKey: ["scheduled_transfers", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_transfers")
        .select(`
          *,
          transfer:transfers(name, origin, destination),
          driver:drivers(full_name),
          vehicle:vehicles(name, plate_number)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as ScheduledTransfer;
    },
    enabled: !!id,
  });
}

export function useCreateScheduledTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: ScheduledTransferInsert) => {
      const { data, error } = await supabase
        .from("scheduled_transfers")
        .insert(s)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["scheduled_transfers"] });
      qc.invalidateQueries({ queryKey: ["scheduled_transfers", vars.transfer_id] });
      toast.success("Schedule added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateScheduledTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: ScheduledTransferUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("scheduled_transfers")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scheduled_transfers"] });
      toast.success("Schedule updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Combined: all schedules for dashboard calendar ──────────────────────────

export interface CalendarEvent {
  id: string;
  kind: "tour" | "transfer";
  date: string;
  time: string | null;
  name: string;
  status: string;
  parentId: string;
}

export function useAllSchedules() {
  return useQuery({
    queryKey: ["all_schedules"],
    queryFn: async () => {
      const [tours, transfers] = await Promise.all([
        supabase
          .from("scheduled_tours")
          .select("id, tour_id, service_date, departure_time, status, tours(name)")
          .order("service_date"),
        supabase
          .from("scheduled_transfers")
          .select("id, transfer_id, service_date, pickup_time, status, transfers(name)")
          .order("service_date"),
      ]);

      if (tours.error) throw tours.error;
      if (transfers.error) throw transfers.error;

      const tourEvents: CalendarEvent[] = (tours.data ?? []).map((r: any) => ({
        id: r.id,
        kind: "tour",
        date: r.service_date,
        time: r.departure_time,
        name: r.tours?.name ?? "Tour",
        status: r.status,
        parentId: r.tour_id,
      }));

      const transferEvents: CalendarEvent[] = (transfers.data ?? []).map((r: any) => ({
        id: r.id,
        kind: "transfer",
        date: r.service_date,
        time: r.pickup_time,
        name: r.transfers?.name ?? "Transfer",
        status: r.status,
        parentId: r.transfer_id,
      }));

      return [...tourEvents, ...transferEvents];
    },
  });
}
