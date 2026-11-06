-- Customer farm workspace: least-privilege access without changing existing data.
-- Deploy before enabling VITE_FEATURE_CUSTOMER_FARMS_ENABLED.
BEGIN;

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

COMMIT;
