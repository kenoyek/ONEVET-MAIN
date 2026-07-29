-- 1Vet Migration Phase 4: Provider Services, Availability & Marketplace Discovery

-- 1. Create provider_services Table
CREATE TABLE IF NOT EXISTS public.provider_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES public.provider_locations(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    'veterinary', 'grooming', 'diagnostics', 'training', 'boarding', 'pet_sitting', 'transportation'
  )),
  name TEXT NOT NULL,
  description TEXT,
  delivery_mode TEXT NOT NULL DEFAULT 'clinic_visit' CHECK (delivery_mode IN (
    'video', 'voice', 'chat', 'clinic_visit', 'home_visit', 'asynchronous'
  )),
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  base_price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  deposit_required BOOLEAN NOT NULL DEFAULT false,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  is_emergency_service BOOLEAN NOT NULL DEFAULT false,
  requires_pet_profile BOOLEAN NOT NULL DEFAULT true,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create provider_availability_rules Table
CREATE TABLE IF NOT EXISTS public.provider_availability_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES public.provider_locations(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  specific_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER NOT NULL DEFAULT 10,
  max_bookings_per_slot INTEGER NOT NULL DEFAULT 1,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create provider_service_areas Table
CREATE TABLE IF NOT EXISTS public.provider_service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  coverage_type TEXT NOT NULL CHECK (coverage_type IN ('radius', 'city', 'postal_code')),
  coverage_value TEXT NOT NULL,
  travel_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Triggers for updated_at
CREATE TRIGGER update_provider_services_updated_at BEFORE UPDATE ON public.provider_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_service_areas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider_services
CREATE POLICY "Public can view active services of approved providers" ON public.provider_services
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.provider_organizations org 
      WHERE org.id = provider_services.provider_id AND org.status = 'active' AND org.verification_status = 'approved'
    ) OR public.is_provider_member(auth.uid(), provider_id) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Provider members can manage their organization services" ON public.provider_services
  FOR ALL USING (
    public.has_provider_permission(auth.uid(), provider_id, 'manage_services') OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for provider_availability_rules
CREATE POLICY "Public can view availability rules of active providers" ON public.provider_availability_rules
  FOR SELECT USING (true);

CREATE POLICY "Provider members can manage availability rules" ON public.provider_availability_rules
  FOR ALL USING (
    public.has_provider_permission(auth.uid(), provider_id, 'manage_services') OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for provider_service_areas
CREATE POLICY "Public can view service areas" ON public.provider_service_areas
  FOR SELECT USING (true);

CREATE POLICY "Provider members can manage service areas" ON public.provider_service_areas
  FOR ALL USING (
    public.has_provider_permission(auth.uid(), provider_id, 'manage_services') OR public.has_role(auth.uid(), 'admin')
  );

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_provider_services_provider_id ON public.provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_services_category ON public.provider_services(category);
CREATE INDEX IF NOT EXISTS idx_provider_services_active ON public.provider_services(is_active);
CREATE INDEX IF NOT EXISTS idx_availability_rules_provider_id ON public.provider_availability_rules(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_provider_id ON public.provider_service_areas(provider_id);
