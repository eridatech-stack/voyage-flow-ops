
-- VEHICLES
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('van','bus','sedan','minibus')),
  plate_number text NOT NULL,
  capacity int NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','on_trip','maintenance')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage vehicles" ON public.vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- DRIVERS
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  license_type text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','on_trip','off_duty')),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage drivers" ON public.drivers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TOURS
CREATE TABLE public.tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration text,
  destination text,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tours TO authenticated;
GRANT ALL ON public.tours TO service_role;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage tours" ON public.tours FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TRANSFERS
CREATE TABLE public.transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  origin text,
  destination text,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transfers TO authenticated;
GRANT ALL ON public.transfers TO service_role;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage transfers" ON public.transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SCHEDULED TOURS
CREATE TABLE public.scheduled_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  departure_time time,
  guide_name text,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  max_capacity int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed','pending','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_tours TO authenticated;
GRANT ALL ON public.scheduled_tours TO service_role;
ALTER TABLE public.scheduled_tours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage scheduled_tours" ON public.scheduled_tours FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SCHEDULED TRANSFERS
CREATE TABLE public.scheduled_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  pickup_time time,
  pickup_location text,
  dropoff_location text,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed','pending','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_transfers TO authenticated;
GRANT ALL ON public.scheduled_transfers TO service_role;
ALTER TABLE public.scheduled_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage scheduled_transfers" ON public.scheduled_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CUSTOMERS
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  booking_reference text,
  special_requests text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid','pending','refunded')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TOUR BOOKINGS
CREATE TABLE public.tour_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_tour_id uuid NOT NULL REFERENCES public.scheduled_tours(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  seat_count int NOT NULL DEFAULT 1,
  voucher_status text NOT NULL DEFAULT 'pending' CHECK (voucher_status IN ('pending','generated')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_bookings TO authenticated;
GRANT ALL ON public.tour_bookings TO service_role;
ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage tour_bookings" ON public.tour_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TRANSFER BOOKINGS
CREATE TABLE public.transfer_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_transfer_id uuid NOT NULL REFERENCES public.scheduled_transfers(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  passenger_count int NOT NULL DEFAULT 1,
  luggage_count int NOT NULL DEFAULT 0,
  flight_number text,
  flight_time timestamptz,
  voucher_status text NOT NULL DEFAULT 'pending' CHECK (voucher_status IN ('pending','generated')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transfer_bookings TO authenticated;
GRANT ALL ON public.transfer_bookings TO service_role;
ALTER TABLE public.transfer_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage transfer_bookings" ON public.transfer_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ACCOUNTING ENTRIES
CREATE TABLE public.accounting_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text NOT NULL CHECK (service_type IN ('tour','transfer')),
  booking_id uuid,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid','pending','refunded')),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_entries TO authenticated;
GRANT ALL ON public.accounting_entries TO service_role;
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage accounting_entries" ON public.accounting_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
