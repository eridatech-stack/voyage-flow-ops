import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSettings, upsertSettings } from "@/server/data";

export type AgencySettings = NonNullable<Awaited<ReturnType<typeof getSettings>>>;

export const DEFAULT_SETTINGS = {
  id: "default", agency_name: "InTravelSync", contact_email: "ops@intravelsync.com",
  support_phone: null, address: null, website: null, currency: "USD",
  timezone: "Asia/Yerevan", voucher_footer: "Thank you for travelling with us.",
  voucher_show_qr: true, voucher_auto_email: true, voucher_signature_line: false,
  email_from_name: "InTravelSync", email_reply_to: null, resend_api_key: null,
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
};

export function useSettings() {
  return useQuery({ queryKey: ["agency_settings"], queryFn: async () => { const s = await getSettings(); return s ?? DEFAULT_SETTINGS as any; } });
}
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => upsertSettings({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["agency_settings"] }); toast.success("Settings saved"); }, onError: (e: Error) => toast.error(e.message) });
}
