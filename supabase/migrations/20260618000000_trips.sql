CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  trip_date date NOT NULL,
  pickup_time time,
  pickup_location text,
  dropoff_location text,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed','pending','cancelled','completed')),
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trip_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  passenger_count int NOT NULL DEFAULT 1,
  luggage_count int NOT NULL DEFAULT 0,
  flight_number text,
  flight_time text,
  voucher_status text NOT NULL DEFAULT 'pending' CHECK (voucher_status IN ('pending','generated')),
  amount numeric(10,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_trips" ON public.trips FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_trips" ON public.trips FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_trip_bookings" ON public.trip_bookings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_trip_bookings" ON public.trip_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_bookings TO anon, authenticated;
GRANT ALL ON public.trips TO service_role;
GRANT ALL ON public.trip_bookings TO service_role;
