import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTransfers, getTransfer, createTransfer, updateTransfer, archiveTransfer } from "@/server/data";

export type Transfer = Awaited<ReturnType<typeof getTransfers>>[number];

export function useTransfers() {
  return useQuery({ queryKey: ["transfers"], queryFn: getTransfers });
}
export function useTransfer(id: string) {
  return useQuery({ queryKey: ["transfers", id], queryFn: () => getTransfer(id), enabled: !!id });
}
export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTransfer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transfers"] }); toast.success("Transfer created"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUpdateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => updateTransfer(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transfers"] }); toast.success("Transfer updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useArchiveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveTransfer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transfers"] }); toast.success("Transfer archived"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
