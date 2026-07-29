-- 1Vet Migration Phase 1: Role-Based Accounts and Provider Organisations

-- 1. Extend app_role Enum to support all 12 platform roles + legacy roles
DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'clinic_admin';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'groomer';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'laboratory';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pharmacy';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'trainer';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'provider_staff';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support_agent';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- 2. Create provider_organizations Table
CREATE TABLE IF NOT EXISTS public.provider_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN (
    'veterinary_clinic', 'independent_veterinarian', 'grooming_business',
    'diagnostic_laboratory', 'pharmacy', 'pet_store', 'pet_trainer', 'mobile_service_provider'
  )),
  description TEXT,
  logo_url TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  country TEXT NOT NULL DEFAULT 'Nigeria',
  state TEXT,
  city TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  verification_status TEXT NOT NULL DEFAULT 'draft' CHECK (verification_status IN (
    'draft', 'submitted', 'under_review', 'more_info_required', 'approved', 'rejected', 'suspended', 'deactivated'
  )),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create provider_members Table
CREATE TABLE IF NOT EXISTS public.provider_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_role TEXT NOT NULL DEFAULT 'staff' CHECK (member_role IN ('owner', 'manager', 'staff', 'practitioner')),
  permissions JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(provider_id, user_id)
);

-- 4. Create provider_locations Table
CREATE TABLE IF NOT EXISTS public.provider_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'Nigeria',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Triggers for updated_at
CREATE TRIGGER update_provider_organizations_updated_at BEFORE UPDATE ON public.provider_organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_members_updated_at BEFORE UPDATE ON public.provider_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_locations_updated_at BEFORE UPDATE ON public.provider_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Helper Functions for Provider Permissions
CREATE OR REPLACE FUNCTION public.is_provider_member(_user_id UUID, _provider_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.provider_members
    WHERE user_id = _user_id AND provider_id = _provider_id AND status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_provider_permission(_user_id UUID, _provider_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.provider_members
    WHERE user_id = _user_id 
      AND provider_id = _provider_id 
      AND status = 'active'
      AND (member_role = 'owner' OR permissions ? _permission)
  );
END;
$$;

-- 7. Enable RLS
ALTER TABLE public.provider_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_locations ENABLE ROW LEVEL SECURITY;

-- Policies for provider_organizations
CREATE POLICY "Public can view active approved provider organizations" ON public.provider_organizations
  FOR SELECT USING (status = 'active' AND verification_status = 'approved');

CREATE POLICY "Members and Admins can view their provider organizations" ON public.provider_organizations
  FOR SELECT USING (
    public.is_provider_member(auth.uid(), id) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Authenticated users can create provider organizations" ON public.provider_organizations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners and Admins can update provider organizations" ON public.provider_organizations
  FOR UPDATE USING (
    public.has_provider_permission(auth.uid(), id, 'manage_organization') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

-- Policies for provider_members
CREATE POLICY "Members can view co-members of their organization" ON public.provider_members
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_provider_member(auth.uid(), provider_id) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners can manage organization staff" ON public.provider_members
  FOR ALL USING (
    public.has_provider_permission(auth.uid(), provider_id, 'manage_staff') OR public.has_role(auth.uid(), 'admin')
  );

-- Policies for provider_locations
CREATE POLICY "Public can view active locations of approved providers" ON public.provider_locations
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.provider_organizations org 
      WHERE org.id = provider_locations.provider_id AND org.status = 'active' AND org.verification_status = 'approved'
    )
  );

CREATE POLICY "Members can manage provider locations" ON public.provider_locations
  FOR ALL USING (
    public.has_provider_permission(auth.uid(), provider_id, 'manage_locations') OR public.has_role(auth.uid(), 'admin')
  );

-- 8. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_provider_orgs_slug ON public.provider_organizations(slug);
CREATE INDEX IF NOT EXISTS idx_provider_orgs_type ON public.provider_organizations(provider_type);
CREATE INDEX IF NOT EXISTS idx_provider_orgs_verification ON public.provider_organizations(verification_status);
CREATE INDEX IF NOT EXISTS idx_provider_members_user_id ON public.provider_members(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_members_provider_id ON public.provider_members(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_locations_provider_id ON public.provider_locations(provider_id);
