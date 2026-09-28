import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAccountingEntries, createAccountingEntry, updateAccountingEntry, getAccountingSummary } from "@/fns/data";

export type AccountingEntry = Awaited<ReturnType<typeof getAccountingEntries>>[number];

export function useAccountingEntries(filters?: { from?: string; to?: string; status?: string; service_type?: string }) {
  return useQuery({ queryKey: ["accounting", filters], queryFn: () => getAccountingEntries({ data: filters ?? {} }) });
}
export function useCreateAccountingEntry() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => createAccountingEntry({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounting"] }); qc.invalidateQueries({ queryKey: ["accounting_summary"] }); toast.success("Entry added"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useUpdateAccountingEntry() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => updateAccountingEntry({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounting"] }); qc.invalidateQueries({ queryKey: ["accounting_summary"] }); toast.success("Entry updated"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useAccountingSummary() {
  return useQuery({ queryKey: ["accounting_summary"], queryFn: () => getAccountingSummary() });
}
