-- 1Vet Migration Phase 6: Veterinary Consultation and Clinical Records

-- 1. Upgrade public.consultations Table
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS clinical_summary TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS subjective_notes TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS objective_notes TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS assessment TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS treatment_plan TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE;

-- 2. Create consultation_symptoms Table
CREATE TABLE IF NOT EXISTS public.consultation_symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  symptom_name TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  duration TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_number TEXT UNIQUE NOT NULL,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  veterinarian_id UUID REFERENCES public.profiles(id) NOT NULL,
  notes TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  valid_until DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Create prescription_items Table
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  refills_allowed INTEGER DEFAULT 0,
  special_instructions TEXT
);

-- 5. Create referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  referring_vet_id UUID REFERENCES public.profiles(id) NOT NULL,
  referred_provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE SET NULL,
  specialty_required TEXT,
  reason TEXT NOT NULL,
  urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'emergency')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. Helper Function: Is Signed Consultation
CREATE OR REPLACE FUNCTION public.is_consultation_signed(_consultation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.consultations
    WHERE id = _consultation_id AND signed_at IS NOT NULL
  );
END;
$$;

-- 7. Enable RLS
ALTER TABLE public.consultation_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Consultation participants can view symptoms" ON public.consultation_symptoms
  FOR SELECT USING (public.is_consultation_participant(consultation_id, auth.uid()));

CREATE POLICY "Consultation participants can insert symptoms" ON public.consultation_symptoms
  FOR INSERT WITH CHECK (public.is_consultation_participant(consultation_id, auth.uid()));

CREATE POLICY "Pet owners and vets can view prescriptions" ON public.prescriptions
  FOR SELECT USING (
    veterinarian_id = public.get_profile_id(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.pets p JOIN public.profiles prof ON p.owner_id = prof.id
      WHERE p.id = prescriptions.pet_id AND prof.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'veterinarian') OR public.has_role(auth.uid(), 'pharmacy') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Only verified veterinarians can create prescriptions" ON public.prescriptions
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'veterinarian') AND veterinarian_id = public.get_profile_id(auth.uid())
  );

CREATE POLICY "Participants can view prescription items" ON public.prescription_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prescriptions p WHERE p.id = prescription_items.prescription_id
    )
  );

CREATE POLICY "Vets can insert prescription items" ON public.prescription_items
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'veterinarian')
  );

CREATE POLICY "Participants can view referrals" ON public.referrals
  FOR SELECT USING (public.is_consultation_participant(consultation_id, auth.uid()));

CREATE POLICY "Vets can create referrals" ON public.referrals
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'veterinarian'));

-- 8. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_pet_id ON public.prescriptions(pet_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_vet_id ON public.prescriptions(veterinarian_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON public.prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_referrals_consultation_id ON public.referrals(consultation_id);
