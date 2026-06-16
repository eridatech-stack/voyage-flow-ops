-- Allow anonymous access to all tables (no auth required for now)
-- This lets the app work without login while we build it

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tours','transfers','vehicles','drivers',
    'scheduled_tours','scheduled_transfers',
    'customers','tour_bookings','transfer_bookings',
    'accounting_entries'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "anon_all_%I" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END $$;
