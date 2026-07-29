-- 1Vet Migration Phase 2: Provider Verification and Compliance

-- 1. Create provider_verification_cases Table
CREATE TABLE IF NOT EXISTS public.provider_verification_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'draft', 'submitted', 'under_review', 'more_info_required', 'approved', 'rejected', 'suspended', 'deactivated'
  )),
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  internal_notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create provider_documents Table
CREATE TABLE IF NOT EXISTS public.provider_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'identity_document', 'veterinary_license', 'business_registration',
    'operating_permit', 'certification', 'proof_of_address', 'facility_photo'
  )),
  document_number TEXT,
  issuing_authority TEXT,
  issued_at DATE,
  expires_at DATE,
  file_path TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create provider_status_history Table (Audit log for provider verification status changes)
CREATE TABLE IF NOT EXISTS public.provider_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Triggers for updated_at
CREATE TRIGGER update_provider_verification_cases_updated_at BEFORE UPDATE ON public.provider_verification_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_documents_updated_at BEFORE UPDATE ON public.provider_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE public.provider_verification_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider_verification_cases
CREATE POLICY "Provider members can view their verification case" ON public.provider_verification_cases
  FOR SELECT USING (
    public.is_provider_member(auth.uid(), provider_id) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Provider owners can submit verification case" ON public.provider_verification_cases
  FOR INSERT WITH CHECK (
    public.has_provider_permission(auth.uid(), provider_id, 'manage_organization') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can review and update verification cases" ON public.provider_verification_cases
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

-- RLS Policies for provider_documents
CREATE POLICY "Provider members and Admins can view provider documents" ON public.provider_documents
  FOR SELECT USING (
    public.is_provider_member(auth.uid(), provider_id) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Provider owners can upload documents" ON public.provider_documents
  FOR INSERT WITH CHECK (
    public.has_provider_permission(auth.uid(), provider_id, 'manage_organization') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can verify or update document status" ON public.provider_documents
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

-- RLS Policies for provider_status_history
CREATE POLICY "Provider members and Admins can view status history" ON public.provider_status_history
  FOR SELECT USING (
    public.is_provider_member(auth.uid(), provider_id) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Admins can insert status history" ON public.provider_status_history
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.is_provider_member(auth.uid(), provider_id)
  );

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_verification_cases_provider_id ON public.provider_verification_cases(provider_id);
CREATE INDEX IF NOT EXISTS idx_verification_cases_status ON public.provider_verification_cases(status);
CREATE INDEX IF NOT EXISTS idx_provider_documents_provider_id ON public.provider_documents(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_type ON public.provider_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_status_history_provider_id ON public.provider_status_history(provider_id);
