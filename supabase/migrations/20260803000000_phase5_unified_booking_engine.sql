-- 1Vet Migration Phase 5: Unified Booking and Scheduling Engine

-- 1. Upgrade public.bookings Table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_reference TEXT UNIQUE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS provider_service_id UUID REFERENCES public.provider_services(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.provider_locations(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS assigned_provider_member_id UUID REFERENCES public.provider_members(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS start_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS end_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Africa/Lagos';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS delivery_mode TEXT DEFAULT 'clinic_visit';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_notes TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS provider_notes TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS travel_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Backfill client_id from customer_id where missing
UPDATE public.bookings SET client_id = customer_id WHERE client_id IS NULL;

-- 2. Create booking_status_history Table
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create booking_participants Table
CREATE TABLE IF NOT EXISTS public.booking_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(booking_id, user_id)
);

-- 4. Create booking_reminders Table
CREATE TABLE IF NOT EXISTS public.booking_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT '24h_before',
  channel TEXT NOT NULL DEFAULT 'in_app',
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Anti-Double-Booking Lock Helper Function
CREATE OR REPLACE FUNCTION public.check_booking_slot_available(
  _provider_id UUID,
  _start_at TIMESTAMP WITH TIME ZONE,
  _end_at TIMESTAMP WITH TIME ZONE,
  _exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE provider_id = _provider_id
      AND status IN ('pending', 'awaiting_confirmation', 'confirmed', 'checked_in', 'in_progress')
      AND (id != _exclude_booking_id OR _exclude_booking_id IS NULL)
      AND start_at < _end_at
      AND end_at > _start_at
  );
END;
$$;

-- 6. Enable RLS
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Booking participants can view status history" ON public.booking_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.profiles p ON b.client_id = p.id
      WHERE b.id = booking_status_history.booking_id AND (p.user_id = auth.uid() OR public.is_provider_member(auth.uid(), b.provider_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Booking participants can view participants" ON public.booking_participants
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Booking participants can view reminders" ON public.booking_reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.profiles p ON b.client_id = p.id
      WHERE b.id = booking_reminders.booking_id AND (p.user_id = auth.uid() OR public.is_provider_member(auth.uid(), b.provider_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pet_id ON public.bookings(pet_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_at ON public.bookings(start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking ON public.booking_status_history(booking_id);
