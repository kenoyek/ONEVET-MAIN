-- 1Vet Migration Phase 3: Enhanced Pet Health Profiles (Digital Medical Passport)

-- 1. Standardize and Expand public.pets Table
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS microchip_number TEXT;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS neutered_status BOOLEAN DEFAULT false;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS estimated_age TEXT;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS colour TEXT;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS primary_vet_provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE SET NULL;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Create pet_caregivers Table
CREATE TABLE IF NOT EXISTS public.pet_caregivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  relationship TEXT DEFAULT 'co_owner',
  permission_level TEXT NOT NULL DEFAULT 'view_only' CHECK (permission_level IN (
    'view_only', 'manage_bookings', 'manage_health_records', 'full_owner_access'
  )),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(pet_id, user_id)
);

-- 3. Create pet_allergies Table
CREATE TABLE IF NOT EXISTS public.pet_allergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  allergen TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Create pet_conditions Table
CREATE TABLE IF NOT EXISTS public.pet_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  condition_name TEXT NOT NULL,
  diagnosed_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'managed', 'resolved')),
  notes TEXT,
  diagnosed_by_vet_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Create pet_medications Table
CREATE TABLE IF NOT EXISTS public.pet_medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  prescribed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. Create pet_vaccinations Table
CREATE TABLE IF NOT EXISTS public.pet_vaccinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  vaccine_name TEXT NOT NULL,
  administered_date DATE NOT NULL,
  next_due_date DATE,
  batch_number TEXT,
  administered_by_vet_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 7. Create pet_weight_records Table
CREATE TABLE IF NOT EXISTS public.pet_weight_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'kg',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 8. Create pet_documents Table
CREATE TABLE IF NOT EXISTS public.pet_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'lab_report', 'x_ray', 'prescription', 'vaccination_cert', 'grooming_record', 'general'
  )),
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 9. Create pet_health_timeline Table
CREATE TABLE IF NOT EXISTS public.pet_health_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'consultation', 'diagnosis', 'vaccination', 'prescription',
    'lab_result', 'grooming', 'weight_update', 'admission', 'procedure', 'document_upload'
  )),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 10. Helper Functions for Caregiver Permissions
CREATE OR REPLACE FUNCTION public.has_pet_access(_user_id UUID, _pet_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.pets p
    JOIN public.profiles prof ON p.owner_id = prof.id
    WHERE p.id = _pet_id AND prof.user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.pet_caregivers
    WHERE pet_id = _pet_id AND user_id = _user_id
  ) OR public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'veterinarian');
END;
$$;

-- 11. Enable RLS
ALTER TABLE public.pet_caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_health_timeline ENABLE ROW LEVEL SECURITY;

-- Policies for pet_caregivers
CREATE POLICY "Owners and caregivers can view caregiver records" ON public.pet_caregivers
  FOR SELECT USING (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Pet owners can manage caregivers" ON public.pet_caregivers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pets p JOIN public.profiles prof ON p.owner_id = prof.id
      WHERE p.id = pet_caregivers.pet_id AND prof.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- Policies for pet health records (allergies, conditions, medications, vaccinations, weight, docs, timeline)
CREATE POLICY "Authorized users can view pet health details" ON public.pet_allergies
  FOR SELECT USING (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Authorized users can manage pet allergies" ON public.pet_allergies
  FOR ALL USING (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Authorized users can view pet conditions" ON public.pet_conditions
  FOR SELECT USING (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Authorized users can manage pet conditions" ON public.pet_conditions
  FOR ALL USING (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Authorized users can view pet medications" ON public.pet_medications
  FOR SELECT USING (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Authorized users can manage pet medications" ON public.pet_medications
  FOR ALL USING (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Authorized users can view pet vaccinations" ON public.pet_vaccinations
  FOR SELECT USING (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Authorized users can manage pet vaccinations" ON public.pet_vaccinations
  FOR ALL USING (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Authorized users can view pet weight records" ON public.pet_weight_records
  FOR SELECT USING (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Authorized users can insert weight records" ON public.pet_weight_records
  FOR INSERT WITH CHECK (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Authorized users can view pet documents" ON public.pet_documents
  FOR SELECT USING (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Authorized users can upload pet documents" ON public.pet_documents
  FOR INSERT WITH CHECK (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Authorized users can view pet timeline" ON public.pet_health_timeline
  FOR SELECT USING (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Authorized users can log timeline events" ON public.pet_health_timeline
  FOR INSERT WITH CHECK (public.has_pet_access(auth.uid(), pet_id));

-- 12. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_caregivers_pet_id ON public.pet_caregivers(pet_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_user_id ON public.pet_caregivers(user_id);
CREATE INDEX IF NOT EXISTS idx_allergies_pet_id ON public.pet_allergies(pet_id);
CREATE INDEX IF NOT EXISTS idx_conditions_pet_id ON public.pet_conditions(pet_id);
CREATE INDEX IF NOT EXISTS idx_medications_pet_id ON public.pet_medications(pet_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_pet_id ON public.pet_vaccinations(pet_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_pet_id ON public.pet_weight_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_timeline_pet_id ON public.pet_health_timeline(pet_id);
CREATE INDEX IF NOT EXISTS idx_timeline_event_date ON public.pet_health_timeline(event_date);
