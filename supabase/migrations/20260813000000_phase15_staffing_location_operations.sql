-- 1Vet Migration Phase 15: Multi-Provider Staffing, Scheduling and Location Operations

-- 1. Create staff_shifts Table
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES public.provider_locations(id) ON DELETE CASCADE NOT NULL,
  staff_member_id UUID REFERENCES public.provider_members(id) ON DELETE CASCADE NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  role_on_shift TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'clocked_in', 'clocked_out', 'cancelled', 'absent')),
  clock_in_at TIMESTAMP WITH TIME ZONE,
  clock_out_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create facility_rooms Table
CREATE TABLE IF NOT EXISTS public.facility_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES public.provider_locations(id) ON DELETE CASCADE NOT NULL,
  room_name TEXT NOT NULL,
  room_type TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create location_operating_hours Table
CREATE TABLE IF NOT EXISTS public.location_operating_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES public.provider_locations(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6) NOT NULL,
  opens_at TIME NOT NULL,
  closes_at TIME NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(location_id, day_of_week)
);

-- 4. Trigger for updated_at
CREATE TRIGGER update_staff_shifts_updated_at BEFORE UPDATE ON public.staff_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_operating_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view facility operating hours" ON public.location_operating_hours
  FOR SELECT USING (true);

CREATE POLICY "Public can view facility rooms" ON public.facility_rooms
  FOR SELECT USING (is_active = true);

CREATE POLICY "Provider members can view staff shifts" ON public.staff_shifts
  FOR SELECT USING (public.is_provider_member(auth.uid(), provider_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Provider managers can manage staff shifts" ON public.staff_shifts
  FOR ALL USING (public.has_provider_permission(auth.uid(), provider_id, 'manage_staff') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Provider managers can manage facility rooms" ON public.facility_rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.provider_locations loc WHERE loc.id = facility_rooms.location_id AND (public.has_provider_permission(auth.uid(), loc.provider_id, 'manage_organization') OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Provider managers can manage operating hours" ON public.location_operating_hours
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.provider_locations loc WHERE loc.id = location_operating_hours.location_id AND (public.has_provider_permission(auth.uid(), loc.provider_id, 'manage_organization') OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_staff_shifts_provider ON public.staff_shifts(provider_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_location ON public.staff_shifts(location_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_date ON public.staff_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_facility_rooms_location ON public.facility_rooms(location_id);
