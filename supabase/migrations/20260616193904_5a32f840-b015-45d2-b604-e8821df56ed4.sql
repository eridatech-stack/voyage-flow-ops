DO $$
DECLARE
  t text;
  tables text[] := ARRAY['vehicles','drivers','tours','scheduled_tours','transfers','scheduled_transfers','customers','tour_bookings','transfer_bookings','accounting_entries'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can manage %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Authenticated users can manage %I" ON public.%I FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t, t);
  END LOOP;
END $$;