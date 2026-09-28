import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTrips, getTrip, createTrip, updateTrip, deleteTrip, getTripBookings, addTripBooking, updateTripBooking, generateTripVoucher, removeTripBooking } from "@/server/data";

export type Trip = Awaited<ReturnType<typeof getTrips>>[number];
export type TripBooking = Awaited<ReturnType<typeof getTripBookings>>[number];

export function useTrips() { return useQuery({ queryKey: ["trips"], queryFn: () => getTrips() }); }
export function useTrip(id: string) { return useQuery({ queryKey: ["trips", id], queryFn: () => getTrip({ data: { id } }), enabled: !!id }); }
export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => createTrip({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["trips"] }); toast.success("Trip created"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => updateTrip({ data: d }), onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["trips"] }); qc.invalidateQueries({ queryKey: ["trips", vars.id] }); toast.success("Trip updated"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deleteTrip({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["trips"] }); toast.success("Trip deleted"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useTripBookings(tripId: string) { return useQuery({ queryKey: ["trip_bookings", tripId], queryFn: () => getTripBookings({ data: { tripId } }), enabled: !!tripId }); }
export function useAddTripBooking() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => addTripBooking({ data: d }), onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["trip_bookings", vars.trip_id] }); qc.invalidateQueries({ queryKey: ["accounting"] }); toast.success("Customer added"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useUpdateTripBooking() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => updateTripBooking({ data: d }), onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["trip_bookings", vars.tripId] }); toast.success("Customer updated"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useGenerateTripVoucher() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ bookingId, tripId }: { bookingId: string; tripId: string }) => generateTripVoucher({ data: { bookingId } }), onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["trip_bookings", vars.tripId] }); toast.success("Voucher generated"); }, onError: (e: Error) => toast.error(e.message) });
}
export function useRemoveTripBooking() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ bookingId, tripId }: { bookingId: string; tripId: string }) => removeTripBooking({ data: { bookingId } }), onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["trip_bookings", vars.tripId] }); toast.success("Customer removed"); }, onError: (e: Error) => toast.error(e.message) });
}
