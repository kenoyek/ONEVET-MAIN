-- 1Vet Migration Phase 13: Livestock and Production Animal Care Module

-- 1. Create livestock_farms Table
CREATE TABLE IF NOT EXISTS public.livestock_farms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  farm_name TEXT NOT NULL,
  registration_number TEXT,
  farm_type TEXT NOT NULL,
  location_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  total_acreage DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create livestock_batches Table
CREATE TABLE IF NOT EXISTS public.livestock_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID REFERENCES public.livestock_farms(id) ON DELETE CASCADE NOT NULL,
  batch_code TEXT UNIQUE NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  head_count INTEGER NOT NULL DEFAULT 1,
  purpose TEXT,
  housing_unit TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'quarantined', 'sold', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create flock_health_records Table
CREATE TABLE IF NOT EXISTS public.flock_health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES public.livestock_batches(id) ON DELETE CASCADE NOT NULL,
  attending_vet_id UUID REFERENCES public.profiles(id),
  recorded_by_id UUID REFERENCES public.profiles(id) NOT NULL,
  record_type TEXT NOT NULL,
  affected_count INTEGER DEFAULT 0,
  mortality_count INTEGER DEFAULT 0,
  observations TEXT NOT NULL,
  treatment_administered TEXT,
  withdrawal_period_days INTEGER DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Trigger for updated_at
CREATE TRIGGER update_livestock_farms_updated_at BEFORE UPDATE ON public.livestock_farms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE public.livestock_farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flock_health_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Farm owners and vets can view farms" ON public.livestock_farms
  FOR SELECT USING (
    owner_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'veterinarian') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Farm owners can manage farms" ON public.livestock_farms
  FOR ALL USING (
    owner_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Farm owners and vets can view batches" ON public.livestock_batches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.livestock_farms f WHERE f.id = livestock_batches.farm_id AND (f.owner_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'veterinarian') OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Farm owners and vets can view health records" ON public.flock_health_records
  FOR SELECT USING (
    recorded_by_id = public.get_profile_id(auth.uid()) OR attending_vet_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR EXISTS (
      SELECT 1 FROM public.livestock_batches b JOIN public.livestock_farms f ON b.farm_id = f.id
      WHERE b.id = flock_health_records.batch_id AND f.owner_id = public.get_profile_id(auth.uid())
    )
  );

CREATE POLICY "Vets and farm managers can create health records" ON public.flock_health_records
  FOR INSERT WITH CHECK (
    recorded_by_id = public.get_profile_id(auth.uid())
  );

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_livestock_farms_owner ON public.livestock_farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_livestock_batches_farm ON public.livestock_batches(farm_id);
CREATE INDEX IF NOT EXISTS idx_flock_health_batch ON public.flock_health_records(batch_id);
