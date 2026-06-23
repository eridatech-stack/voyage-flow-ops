import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AccountingEntry {
  id: string;
  service_type: "tour" | "transfer" | "trip";
  booking_id: string | null;
  customer_id: string | null;
  amount: number;
  payment_method: string | null;
  status: "paid" | "pending" | "refunded";
  entry_date: string;
  notes: string | null;
  created_at: string;
  customer?: { full_name: string } | null;
}

export type AccountingInsert = Omit<AccountingEntry, "id" | "created_at" | "customer">;

export function useAccountingEntries(filters?: {
  from?: string;
  to?: string;
  status?: string;
  service_type?: string;
}) {
  return useQuery({
    queryKey: ["accounting", filters],
    queryFn: async () => {
      let q = supabase
        .from("accounting_entries")
        .select("*, customer:customers(full_name)")
        .order("entry_date", { ascending: false });

      if (filters?.from) q = q.gte("entry_date", filters.from);
      if (filters?.to) q = q.lte("entry_date", filters.to);
      if (filters?.status && filters.status !== "all") q = q.eq("status", filters.status);
      if (filters?.service_type && filters.service_type !== "all") q = q.eq("service_type", filters.service_type);

      const { data, error } = await q;
      if (error) throw error;
      return data as AccountingEntry[];
    },
  });
}

export function useCreateAccountingEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: AccountingInsert) => {
      const { data, error } = await supabase
        .from("accounting_entries")
        .insert(entry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting"] });
      toast.success("Entry added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAccountingEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: Partial<AccountingInsert> & { id: string }) => {
      const { data, error } = await supabase
        .from("accounting_entries")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting"] });
      toast.success("Entry updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Summary stats ───────────────────────────────────────────────────────────

export function useAccountingSummary() {
  return useQuery({
    queryKey: ["accounting_summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_entries")
        .select("amount, status");
      if (error) throw error;

      const entries = data ?? [];
      const totalRevenue = entries
        .filter((e) => e.status === "paid")
        .reduce((sum, e) => sum + (e.amount ?? 0), 0);
      const unpaidAmount = entries
        .filter((e) => e.status === "pending")
        .reduce((sum, e) => sum + (e.amount ?? 0), 0);
      const totalEntries = entries.length;

      return { totalRevenue, unpaidAmount, totalEntries };
    },
  });
}
