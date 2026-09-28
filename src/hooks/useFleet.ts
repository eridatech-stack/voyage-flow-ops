import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getVehicles, createVehicle, updateVehicle, getDrivers, createDriver, updateDriver } from "@/server/data";

export type Vehicle = Awaited<ReturnType<typeof getVehicles>>[number];
export type Driver = Awaited<ReturnType<typeof getDrivers>>[number];

export function useVehicles() {
  return useQuery({ queryKey: ["vehicles"], queryFn: getVehicles });
}
export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); toast.success("Vehicle added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => updateVehicle(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); qc.invalidateQueries({ queryKey: ["drivers"] }); toast.success("Vehicle updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDrivers() {
  return useQuery({ queryKey: ["drivers"], queryFn: getDrivers });
}
export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDriver,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drivers"] }); toast.success("Driver added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => updateDriver(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drivers"] }); toast.success("Driver updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
