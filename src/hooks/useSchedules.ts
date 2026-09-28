import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getScheduledTransfers, getScheduledTransfer, createScheduledTransfer, updateScheduledTransfer,
  getAllSchedules,
} from "@/server/data";
import {
  getScheduledTours as getTourSchedules,
  getScheduledTour as getTourSchedule,
  createScheduledTour as createTourSchedule,
  updateScheduledTour as updateTourSchedule,
  deleteScheduledTour as deleteTourSchedule,
} from "@/server/tours";

export type ScheduledTour = Awaited<ReturnType<typeof getTourSchedules>>[number];
export type ScheduledTransfer = Awaited<ReturnType<typeof getScheduledTransfers>>[number];
export type CalendarEvent = Awaited<ReturnType<typeof getAllSchedules>>[number];
export type ScheduledTourInsert = Parameters<typeof createTourSchedule>[0];
export type ScheduledTransferInsert = Parameters<typeof createScheduledTransfer>[0];

export function useScheduledTours(tourId?: string) {
  return useQuery({ queryKey: ["scheduled_tours", tourId], queryFn: () => getTourSchedules(tourId) });
}
export function useScheduledTour(id: string) {
  return useQuery({ queryKey: ["scheduled_tours", "detail", id], queryFn: () => getTourSchedule(id), enabled: !!id });
}
export function useCreateScheduledTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTourSchedule,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled_tours"] }); qc.invalidateQueries({ queryKey: ["all_schedules"] }); toast.success("Schedule added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUpdateScheduledTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => updateTourSchedule(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled_tours"] }); toast.success("Schedule updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteScheduledTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTourSchedule,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled_tours"] }); toast.success("Schedule deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useScheduledTransfers(transferId?: string) {
  return useQuery({ queryKey: ["scheduled_transfers", transferId], queryFn: () => getScheduledTransfers(transferId) });
}
export function useScheduledTransfer(id: string) {
  return useQuery({ queryKey: ["scheduled_transfers", "detail", id], queryFn: () => getScheduledTransfer(id), enabled: !!id });
}
export function useCreateScheduledTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createScheduledTransfer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled_transfers"] }); qc.invalidateQueries({ queryKey: ["all_schedules"] }); toast.success("Schedule added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUpdateScheduledTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => updateScheduledTransfer(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled_transfers"] }); toast.success("Schedule updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAllSchedules() {
  return useQuery({ queryKey: ["all_schedules"], queryFn: getAllSchedules });
}
