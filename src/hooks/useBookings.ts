import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTourBookings, addTourBooking, updateTourBooking, generateTourVoucher, generateAllTourVouchers, removeTourBooking } from "@/server/tours";
import { getTransferBookings, addTransferBooking, generateTransferVoucher, generateAllTransferVouchers, removeTransferBooking } from "@/server/data";

export type TourBooking = Awaited<ReturnType<typeof getTourBookings>>[number];
export type TransferBooking = Awaited<ReturnType<typeof getTransferBookings>>[number];
export type Customer = TourBooking["customer"];

export function useTourBookings(scheduledTourId: string) {
  return useQuery({ queryKey: ["tour_bookings", scheduledTourId], queryFn: () => getTourBookings({ data: { scheduledTourId } }), enabled: !!scheduledTourId });
}
export function useAddTourBooking() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => addTourBooking({ data: d }), onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["tour_bookings", vars.scheduled_tour_id] }); qc.invalidateQueries({ queryKey: ["accounting"] }); toast.success("Customer added"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useUpdateTourBooking() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => updateTourBooking({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["tour_bookings"] }); toast.success("Booking updated"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useGenerateTourVoucher() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ bookingId, scheduledTourId }: { bookingId: string; scheduledTourId: string }) => generateTourVoucher({ data: { bookingId } }), onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["tour_bookings", vars.scheduledTourId] }); toast.success("Voucher generated"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useGenerateAllTourVouchers() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (scheduledTourId: string) => generateAllTourVouchers({ data: { scheduledTourId } }), onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: ["tour_bookings", id] }); toast.success("All vouchers generated"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useRemoveTourBooking() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ bookingId, scheduledTourId }: { bookingId: string; scheduledTourId: string }) => removeTourBooking({ data: { bookingId } }), onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["tour_bookings", vars.scheduledTourId] }); toast.success("Customer removed"); }, onError: (e: Error) => toast.error(e.message) });
}

export function useTransferBookings(scheduledTransferId: string) {
  return useQuery({ queryKey: ["transfer_bookings", scheduledTransferId], queryFn: () => getTransferBookings({ data: { scheduledTransferId } }), enabled: !!scheduledTransferId });
}
export function useAddTransferBooking() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => addTransferBooking({ data: d }), onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["transfer_bookings", vars.scheduled_transfer_id] }); qc.invalidateQueries({ queryKey: ["accounting"] }); toast.success("Customer added"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useGenerateTransferVoucher() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ bookingId, scheduledTransferId }: { bookingId: string; scheduledTransferId: string }) => generateTransferVoucher({ data: { bookingId } }), onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["transfer_bookings", vars.scheduledTransferId] }); toast.success("Voucher generated"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useGenerateAllTransferVouchers() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (scheduledTransferId: string) => generateAllTransferVouchers({ data: { scheduledTransferId } }), onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: ["transfer_bookings", id] }); toast.success("All vouchers generated"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useRemoveTransferBooking() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ bookingId, scheduledTransferId }: { bookingId: string; scheduledTransferId: string }) => removeTransferBooking({ data: { bookingId } }), onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["transfer_bookings", vars.scheduledTransferId] }); toast.success("Customer removed"); }, onError: (e: Error) => toast.error(e.message) });
}
