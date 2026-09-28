import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTours, getTour, createTour, updateTour, archiveTour } from "@/server/tours";

export type Tour = Awaited<ReturnType<typeof getTours>>[number];

export function useTours() {
  return useQuery({ queryKey: ["tours"], queryFn: () => getTours() });
}
export function useTour(id: string) {
  return useQuery({ queryKey: ["tours", id], queryFn: () => getTour({ data: { id } }), enabled: !!id });
}
export function useCreateTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: any) => createTour({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tours"] }); toast.success("Tour created"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUpdateTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: any) => updateTour({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tours"] }); toast.success("Tour updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useArchiveTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveTour({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tours"] }); toast.success("Tour archived"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
