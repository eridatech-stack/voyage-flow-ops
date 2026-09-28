import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getScheduledTours, getScheduledTour, createScheduledTour, updateScheduledTour, deleteScheduledTour } from "@/server/tours";
import { getScheduledTransfers, getScheduledTransfer, createScheduledTransfer, updateScheduledTransfer, getAllSchedules } from "@/server/data";

export type ScheduledTour = NonNullable<Awaited<ReturnType<typeof getScheduledTours>>>[number];
export type ScheduledTransfer = NonNullable<Awaited<ReturnType<typeof getScheduledTransfers>>>[number];
export type CalendarEvent = Awaited<ReturnType<typeof getAllSchedules>>[number];
export type ScheduledTourInsert = Parameters<typeof createScheduledTour>[0]["data"];
export type ScheduledTransferInsert = Parameters<typeof createScheduledTransfer>[0]["data"];

export function useScheduledTours(tourId?: string) {
  return useQuery({ queryKey: ["scheduled_tours", tourId], queryFn: () => getScheduledTours({ data: { tourId } }) });
}
export function useScheduledTour(id: string) {
  return useQuery({ queryKey: ["scheduled_tours", "detail", id], queryFn: () => getScheduledTour({ data: { id } }), enabled: !!id });
}
export function useCreateScheduledTour() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => createScheduledTour({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled_tours"] }); qc.invalidateQueries({ queryKey: ["all_schedules"] }); toast.success("Schedule added"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useUpdateScheduledTour() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => updateScheduledTour({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled_tours"] }); toast.success("Schedule updated"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useDeleteScheduledTour() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deleteScheduledTour({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled_tours"] }); toast.success("Schedule deleted"); }, onError: (e: Error) => toast.error(e.message) });
}

export function useScheduledTransfers(transferId?: string) {
  return useQuery({ queryKey: ["scheduled_transfers", transferId], queryFn: () => getScheduledTransfers({ data: { transferId } }) });
}
export function useScheduledTransfer(id: string) {
  return useQuery({ queryKey: ["scheduled_transfers", "detail", id], queryFn: () => getScheduledTransfer({ data: { id } }), enabled: !!id });
}
export function useCreateScheduledTransfer() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => createScheduledTransfer({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled_transfers"] }); qc.invalidateQueries({ queryKey: ["all_schedules"] }); toast.success("Schedule added"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useUpdateScheduledTransfer() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => updateScheduledTransfer({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled_transfers"] }); toast.success("Schedule updated"); }, onError: (e: Error) => toast.error(e.message) });
}

export function useAllSchedules() {
  return useQuery({ queryKey: ["all_schedules"], queryFn: () => getAllSchedules() });
}
