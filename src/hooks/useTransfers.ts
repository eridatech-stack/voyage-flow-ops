import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Transfer {
  id: string;
  name: string;
  origin: string | null;
  destination: string | null;
  base_price: number;
  is_active: boolean;
  created_at: string;
}

export type TransferInsert = Omit<Transfer, "id" | "created_at">;
export type TransferUpdate = Partial<TransferInsert>;

export function useTransfers() {
  return useQuery({
    queryKey: ["transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Transfer[];
    },
  });
}

export function useTransfer(id: string) {
  return useQuery({
    queryKey: ["transfers", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfers")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Transfer;
    },
    enabled: !!id,
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transfer: TransferInsert) => {
      const { data, error } = await supabase
        .from("transfers")
        .insert(transfer)
        .select()
        .single();
      if (error) throw error;
      return data as Transfer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Transfer route created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: TransferUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("transfers")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Transfer;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      qc.invalidateQueries({ queryKey: ["transfers", vars.id] });
      toast.success("Transfer route updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useArchiveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transfers")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Transfer route archived");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
