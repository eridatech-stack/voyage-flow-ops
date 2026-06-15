import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  name: string;
  type: "van" | "bus" | "sedan" | "minibus";
  plate_number: string;
  capacity: number;
  status: "available" | "on_trip" | "maintenance";
  created_at: string;
}

export interface Driver {
  id: string;
  full_name: string;
  phone: string | null;
  license_type: string | null;
  status: "available" | "on_trip" | "off_duty";
  vehicle_id: string | null;
  created_at: string;
  vehicle?: Pick<Vehicle, "name" | "plate_number"> | null;
}

export type VehicleInsert = Omit<Vehicle, "id" | "created_at">;
export type VehicleUpdate = Partial<VehicleInsert>;
export type DriverInsert = Omit<Driver, "id" | "created_at" | "vehicle">;
export type DriverUpdate = Partial<DriverInsert>;

// ── Vehicles ────────────────────────────────────────────────────────────────

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Vehicle[];
    },
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: VehicleInsert) => {
      const { data, error } = await supabase
        .from("vehicles")
        .insert(v)
        .select()
        .single();
      if (error) throw error;
      return data as Vehicle;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: VehicleUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("vehicles")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Vehicle;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Vehicle updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Drivers ─────────────────────────────────────────────────────────────────

export function useDrivers() {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*, vehicle:vehicles(name, plate_number)")
        .order("full_name");
      if (error) throw error;
      return data as Driver[];
    },
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: DriverInsert) => {
      const { data, error } = await supabase
        .from("drivers")
        .insert(d)
        .select()
        .single();
      if (error) throw error;
      return data as Driver;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: DriverUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("drivers")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Driver;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
