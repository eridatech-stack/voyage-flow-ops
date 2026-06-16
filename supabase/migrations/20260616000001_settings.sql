CREATE TABLE public.agency_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name text NOT NULL DEFAULT 'InTravelSync',
  contact_email text NOT NULL DEFAULT 'ops@intravelsync.com',
  support_phone text,
  address text,
  website text,
  currency text NOT NULL DEFAULT 'USD',
  timezone text NOT NULL DEFAULT 'Asia/Yerevan',
  voucher_footer text DEFAULT 'Thank you for travelling with us. Please present this voucher to your guide.',
  voucher_show_qr boolean NOT NULL DEFAULT true,
  voucher_auto_email boolean NOT NULL DEFAULT true,
  voucher_signature_line boolean NOT NULL DEFAULT false,
  email_from_name text DEFAULT 'InTravelSync',
  email_reply_to text,
  resend_api_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only one settings row ever
INSERT INTO public.agency_settings (id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_agency_settings" ON public.agency_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_agency_settings" ON public.agency_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON public.agency_settings TO anon, authenticated;
GRANT ALL ON public.agency_settings TO service_role;
