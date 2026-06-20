-- Add driver_id to scheduled_tours table
ALTER TABLE public.scheduled_tours
  ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL;
