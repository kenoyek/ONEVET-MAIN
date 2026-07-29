-- 1Vet Migration Phase 14: Emergency and 24/7 Care Dispatch System

-- 1. Create emergency_dispatches Table
CREATE TABLE IF NOT EXISTS public.emergency_dispatches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispatch_reference TEXT UNIQUE NOT NULL,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  assigned_provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE SET NULL,
  assigned_responder_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  triage_level TEXT NOT NULL DEFAULT 'urgent' CHECK (triage_level IN ('moderate', 'urgent', 'critical')),
  chief_complaint TEXT NOT NULL,
  location_address TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested', 'triage_completed', 'dispatched', 'en_route',
    'arrived', 'resolved', 'cancelled'
  )),
  dispatched_at TIMESTAMP WITH TIME ZONE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create emergency_triage_questions Table
CREATE TABLE IF NOT EXISTS public.emergency_triage_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispatch_id UUID REFERENCES public.emergency_dispatches(id) ON DELETE CASCADE NOT NULL,
  is_breathing BOOLEAN,
  is_conscious BOOLEAN,
  has_bleeding BOOLEAN,
  has_seizures BOOLEAN,
  has_ingested_toxin BOOLEAN,
  computed_triage_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create emergency_responder_logs Table
CREATE TABLE IF NOT EXISTS public.emergency_responder_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispatch_id UUID REFERENCES public.emergency_dispatches(id) ON DELETE CASCADE NOT NULL,
  status_update TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Trigger for updated_at
CREATE TRIGGER update_emergency_dispatches_updated_at BEFORE UPDATE ON public.emergency_dispatches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE public.emergency_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_triage_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_responder_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Requesters, responders, and vets can view dispatches" ON public.emergency_dispatches
  FOR SELECT USING (
    requester_id = public.get_profile_id(auth.uid()) OR
    assigned_responder_id = public.get_profile_id(auth.uid()) OR
    public.has_role(auth.uid(), 'veterinarian') OR
    public.has_role(auth.uid(), 'admin') OR
    (assigned_provider_id IS NOT NULL AND public.is_provider_member(auth.uid(), assigned_provider_id))
  );

CREATE POLICY "Requesters can create emergency dispatches" ON public.emergency_dispatches
  FOR INSERT WITH CHECK (
    requester_id = public.get_profile_id(auth.uid())
  );

CREATE POLICY "Participants can view triage questions" ON public.emergency_triage_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.emergency_dispatches ed WHERE ed.id = emergency_triage_questions.dispatch_id
    )
  );

CREATE POLICY "Participants can view responder logs" ON public.emergency_responder_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.emergency_dispatches ed WHERE ed.id = emergency_responder_logs.dispatch_id
    )
  );

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_dispatches_requester ON public.emergency_dispatches(requester_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_status ON public.emergency_dispatches(status);
CREATE INDEX IF NOT EXISTS idx_dispatches_triage ON public.emergency_dispatches(triage_level);
