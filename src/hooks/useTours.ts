import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Tour {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  destination: string | null;
  base_price: number;
  is_active: boolean;
  created_at: string;
}

export type TourInsert = Omit<Tour, "id" | "created_at">;
export type TourUpdate = Partial<TourInsert>;

// ── Fetch all active tours ──────────────────────────────────────────────────
export function useTours() {
  return useQuery({
    queryKey: ["tours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tour[];
    },
  });
}

// ── Fetch a single tour ─────────────────────────────────────────────────────
export function useTour(id: string) {
  return useQuery({
    queryKey: ["tours", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Tour;
    },
    enabled: !!id,
  });
}

// ── Create tour ─────────────────────────────────────────────────────────────
export function useCreateTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tour: TourInsert) => {
      const { data, error } = await supabase
        .from("tours")
        .insert(tour)
        .select()
        .single();
      if (error) throw error;
      return data as Tour;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tours"] });
      toast.success("Tour created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Update tour ─────────────────────────────────────────────────────────────
export function useUpdateTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: TourUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("tours")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Tour;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tours"] });
      qc.invalidateQueries({ queryKey: ["tours", vars.id] });
      toast.success("Tour updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Archive (soft-delete) tour ──────────────────────────────────────────────
export function useArchiveTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tours")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tours"] });
      toast.success("Tour archived");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
