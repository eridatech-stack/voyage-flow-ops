import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCustomers, updateCustomer } from "@/fns/data";

export type Customer = Awaited<ReturnType<typeof getCustomers>>[number];

export function useCustomers(filters?: { search?: string; payment_status?: string }) {
  return useQuery({
    queryKey: ["customers", filters],
    queryFn: () => getCustomers({ data: filters ?? {} }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: any) => updateCustomer({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
