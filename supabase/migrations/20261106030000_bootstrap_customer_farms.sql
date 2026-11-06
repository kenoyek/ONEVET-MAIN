-- Provision the customer module on inspected projects where the historical farm
-- migration was never deployed. Existing secured farm installations are retained.
BEGIN;
SET LOCAL lock_timeout='5s';
DO $bootstrap$ BEGIN
 IF to_regclass('public.livestock_farms') IS NULL AND to_regclass('public.livestock_batches') IS NULL AND to_regclass('public.flock_health_records') IS NULL THEN
  EXECUTE $farm_schema$
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

-- Customer farm workspace: least-privilege access without changing existing data.
-- Deploy before enabling VITE_FEATURE_CUSTOMER_FARMS_ENABLED.

-- PostgreSQL ORs permissive policies. Stop rather than silently leave an unknown grant in place.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
    AND tablename IN ('livestock_farms', 'livestock_batches', 'flock_health_records')
    AND policyname NOT IN ('Farm owners and vets can view farms', 'Farm owners can manage farms',
      'Farm owners and vets can view batches', 'Farm owners and vets can view health records',
      'Vets and farm managers can create health records')) THEN
    RAISE EXCEPTION 'Unexpected farm access policy: inspect deployed policies before applying this migration';
  END IF;
END $$;

DROP POLICY IF EXISTS "Farm owners and vets can view farms" ON public.livestock_farms;
DROP POLICY IF EXISTS "Farm owners can manage farms" ON public.livestock_farms;
DROP POLICY IF EXISTS "Farm owners and vets can view batches" ON public.livestock_batches;
DROP POLICY IF EXISTS "Farm owners and vets can view health records" ON public.flock_health_records;
DROP POLICY IF EXISTS "Vets and farm managers can create health records" ON public.flock_health_records;

-- No owner DELETE grant: deleting a parent would cascade through health history.
CREATE POLICY "Owners read their farms" ON public.livestock_farms
  FOR SELECT TO authenticated
  USING (owner_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners create their farms" ON public.livestock_farms
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners update their farms" ON public.livestock_farms
  FOR UPDATE TO authenticated
  USING (owner_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners read their animal groups" ON public.livestock_batches
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.livestock_farms f WHERE f.id = farm_id
    AND (f.owner_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Owners create their animal groups" ON public.livestock_batches
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.livestock_farms f WHERE f.id = farm_id
    AND (f.owner_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Owners update their animal groups" ON public.livestock_batches
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.livestock_farms f WHERE f.id = farm_id
    AND (f.owner_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.livestock_farms f WHERE f.id = farm_id
    AND (f.owner_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))));

-- Owner observations are append-only. Clinical authoring is deliberately not granted here.
CREATE POLICY "Owners and assigned veterinarians read farm records" ON public.flock_health_records
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (attending_vet_id = public.get_profile_id(auth.uid()) AND public.has_role(auth.uid(), 'veterinarian'))
    OR EXISTS (SELECT 1 FROM public.livestock_batches b JOIN public.livestock_farms f ON f.id = b.farm_id
      WHERE b.id = batch_id AND f.owner_id = public.get_profile_id(auth.uid()))
  );

CREATE POLICY "Owners append their own observations" ON public.flock_health_records
  FOR INSERT TO authenticated
  WITH CHECK (
    recorded_by_id = public.get_profile_id(auth.uid())
    AND record_type = 'owner_observation'
    AND attending_vet_id IS NULL
    AND treatment_administered IS NULL
    AND withdrawal_period_days = 0
    AND affected_count >= 0 AND mortality_count >= 0 AND mortality_count <= affected_count
    AND EXISTS (SELECT 1 FROM public.livestock_batches b JOIN public.livestock_farms f ON f.id = b.farm_id
      WHERE b.id = batch_id AND f.owner_id = public.get_profile_id(auth.uid())
      AND b.status IN ('active', 'quarantined') AND affected_count <= b.head_count)
  );

-- NOT VALID preserves historic rows for review while enforcing valid new writes.
ALTER TABLE public.livestock_batches ADD CONSTRAINT livestock_batches_positive_count
  CHECK (head_count > 0) NOT VALID;
ALTER TABLE public.flock_health_records ADD CONSTRAINT flock_health_nonnegative_counts
  CHECK (affected_count >= 0 AND mortality_count >= 0 AND mortality_count <= affected_count) NOT VALID;
ALTER TABLE public.flock_health_records ADD CONSTRAINT flock_health_observation_required
  CHECK (length(btrim(observations)) BETWEEN 1 AND 4000) NOT VALID;
ALTER TABLE public.livestock_farms ADD CONSTRAINT livestock_farm_name_required
  CHECK (length(btrim(farm_name)) BETWEEN 1 AND 120) NOT VALID;


$farm_schema$;
 ELSIF to_regclass('public.livestock_farms') IS NULL OR to_regclass('public.livestock_batches') IS NULL OR to_regclass('public.flock_health_records') IS NULL OR NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='flock_health_records' AND policyname='Owners append their own observations') THEN
  RAISE EXCEPTION 'Partial or unsecured farm module requires policy review';
 END IF;
END $bootstrap$;
REVOKE ALL ON public.livestock_farms,public.livestock_batches,public.flock_health_records FROM PUBLIC,anon;
GRANT SELECT,INSERT,UPDATE ON public.livestock_farms,public.livestock_batches TO authenticated;
GRANT SELECT,INSERT ON public.flock_health_records TO authenticated;
GRANT ALL ON public.livestock_farms,public.livestock_batches,public.flock_health_records TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
