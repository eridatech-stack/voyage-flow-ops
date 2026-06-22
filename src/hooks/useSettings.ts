import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export interface AgencySettings {
  id: string;
  agency_name: string;
  contact_email: string;
  support_phone: string | null;
  address: string | null;
  website: string | null;
  currency: string;
  timezone: string;
  voucher_footer: string | null;
  voucher_show_qr: boolean;
  voucher_auto_email: boolean;
  voucher_signature_line: boolean;
  email_from_name: string | null;
  email_reply_to: string | null;
  resend_api_key: string | null;
}

export const DEFAULT_SETTINGS: AgencySettings = {
  id: SETTINGS_ID,
  agency_name: "InTravelSync",
  contact_email: "ops@intravelsync.com",
  support_phone: "+374 11 22 33 44",
  address: "12 Abovyan Street, Yerevan, Armenia",
  website: "",
  currency: "USD",
  timezone: "Asia/Yerevan",
  voucher_footer: "Thank you for travelling with us. Please present this voucher to your guide.",
  voucher_show_qr: true,
  voucher_auto_email: true,
  voucher_signature_line: false,
  email_from_name: "InTravelSync",
  email_reply_to: "",
  resend_api_key: "",
};

export function useSettings() {
  return useQuery({
    queryKey: ["agency_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_settings" as any)
        .select("*")
        .eq("id", SETTINGS_ID)
        .single();
      if (error) {
        // Table may not exist yet — return defaults
        console.warn("Settings table not ready:", error.message);
        return DEFAULT_SETTINGS;
      }
      return data as unknown as AgencySettings;
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: Partial<Omit<AgencySettings, "id">>) => {
      const { data, error } = await supabase
        .from("agency_settings" as any)
        .upsert({ id: SETTINGS_ID, ...update })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as AgencySettings;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agency_settings"] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
