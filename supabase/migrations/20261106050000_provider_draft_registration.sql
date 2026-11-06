BEGIN;
-- Additive private registration foundation. Does not publish, verify, or enable bookings.
CREATE TABLE public.provider_organizations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
 slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 80),
 provider_type text NOT NULL CHECK (provider_type IN ('veterinary_clinic','independent_veterinarian','grooming_business','diagnostic_laboratory','pharmacy','pet_store','pet_trainer','mobile_service_provider')),
 description text NOT NULL DEFAULT '' CHECK (length(description)<=3000),
 email text NOT NULL CHECK (length(email)<=254 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 phone text NOT NULL DEFAULT '' CHECK (length(phone)<=40),
 website text NOT NULL DEFAULT '' CHECK (length(website)<=300 AND (website='' OR website ~ '^https://[^[:space:]]+$')),
 country text NOT NULL DEFAULT 'Nigeria' CHECK (country='Nigeria'),
 state text NOT NULL CHECK (length(state) BETWEEN 2 AND 80),
 city text NOT NULL CHECK (length(city) BETWEEN 2 AND 80),
 address text NOT NULL CHECK (length(address) BETWEEN 5 AND 300),
 timezone text NOT NULL DEFAULT 'Africa/Lagos' CHECK (timezone='Africa/Lagos'),
 currency text NOT NULL DEFAULT 'NGN' CHECK (currency='NGN'),
 status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive','suspended')),
 verification_status text NOT NULL DEFAULT 'draft' CHECK (verification_status IN ('draft','submitted','under_review','more_info_required','approved','rejected','suspended','deactivated')),
 created_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX provider_organizations_creator_idx ON public.provider_organizations(created_by);
CREATE TABLE public.provider_members (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider_id uuid NOT NULL REFERENCES public.provider_organizations(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id),
 member_role text NOT NULL CHECK (member_role IN ('owner','manager','staff','practitioner')),
 permissions jsonb NOT NULL DEFAULT '[]',
 status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','suspended')),
 invited_by uuid REFERENCES auth.users(id),
 joined_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider_id,user_id)
);
CREATE INDEX provider_members_user_idx ON public.provider_members(user_id);
CREATE TABLE public.provider_locations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider_id uuid NOT NULL REFERENCES public.provider_organizations(id) ON DELETE CASCADE,
 name text NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
 address text NOT NULL CHECK (length(address) BETWEEN 5 AND 300),
 city text NOT NULL CHECK (length(city) BETWEEN 2 AND 80),
 state text NOT NULL CHECK (length(state) BETWEEN 2 AND 80),
 country text NOT NULL DEFAULT 'Nigeria' CHECK (country='Nigeria'),
 phone text NOT NULL DEFAULT '',
 timezone text NOT NULL DEFAULT 'Africa/Lagos' CHECK (timezone='Africa/Lagos'),
 is_primary boolean NOT NULL DEFAULT true,
 is_active boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX provider_locations_primary_idx ON public.provider_locations(provider_id) WHERE is_primary;
ALTER TABLE public.provider_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_locations ENABLE ROW LEVEL SECURITY;
-- No direct client writes, including for administrators. Future approval uses its own reviewed RPC.
REVOKE ALL ON public.provider_organizations,public.provider_members,public.provider_locations FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.provider_organizations,public.provider_members,public.provider_locations TO authenticated;
GRANT ALL ON public.provider_organizations,public.provider_members,public.provider_locations TO service_role;
CREATE POLICY provider_draft_owner_read ON public.provider_organizations FOR SELECT TO authenticated USING (created_by=auth.uid());
CREATE POLICY provider_own_membership_read ON public.provider_members FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY provider_draft_location_read ON public.provider_locations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.provider_organizations o WHERE o.id=provider_id AND o.created_by=auth.uid()));

CREATE FUNCTION public.save_provider_draft(input jsonb, provider_uuid uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); target uuid; v jsonb; existing public.provider_organizations;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Sign in to save an organization' USING ERRCODE='42501'; END IF;
 -- Serialize account registrations to make the draft cap reliable under concurrent requests.
 PERFORM 1 FROM public.profiles WHERE user_id=actor AND is_active=true FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'An active account is required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(input) IS DISTINCT FROM 'object' OR EXISTS (
  SELECT 1 FROM jsonb_object_keys(input) k WHERE k NOT IN ('name','slug','provider_type','description','email','phone','website','state','city','address','primary_location_name')
 ) THEN RAISE EXCEPTION 'Invalid organization fields' USING ERRCODE='22023'; END IF;
 IF EXISTS (SELECT 1 FROM jsonb_each(input) WHERE jsonb_typeof(value) <> 'string') THEN
  RAISE EXCEPTION 'Organization fields must be text' USING ERRCODE='22023';
 END IF;
 SELECT jsonb_object_agg(key,btrim(value #>> '{}')) INTO v FROM jsonb_each(input);
 IF provider_uuid IS NULL THEN
  IF (SELECT count(*) FROM public.provider_organizations WHERE created_by=actor)>=10 THEN
   RAISE EXCEPTION 'Organization limit reached. Contact support.' USING ERRCODE='23514';
  END IF;
  INSERT INTO public.provider_organizations(name,slug,provider_type,description,email,phone,website,state,city,address,created_by)
  VALUES(v->>'name',v->>'slug',v->>'provider_type',coalesce(v->>'description',''),lower(v->>'email'),coalesce(v->>'phone',''),coalesce(v->>'website',''),v->>'state',v->>'city',v->>'address',actor)
  RETURNING id INTO target;
  INSERT INTO public.provider_members(provider_id,user_id,member_role,permissions,invited_by)
  VALUES(target,actor,'owner','["*"]',actor);
  INSERT INTO public.provider_locations(provider_id,name,address,city,state,phone)
  VALUES(target,coalesce(nullif(v->>'primary_location_name',''),v->>'name'),v->>'address',v->>'city',v->>'state',coalesce(v->>'phone',''));
 ELSE
  SELECT * INTO existing FROM public.provider_organizations WHERE id=provider_uuid AND created_by=actor FOR UPDATE;
  IF NOT FOUND OR existing.verification_status <> 'draft' OR existing.status='suspended' OR NOT EXISTS (
   SELECT 1 FROM public.provider_members WHERE provider_id=provider_uuid AND user_id=actor AND member_role='owner' AND status='active'
  ) THEN RAISE EXCEPTION 'Organization draft is unavailable' USING ERRCODE='42501'; END IF;
  IF v->>'slug' IS DISTINCT FROM existing.slug OR v->>'provider_type' IS DISTINCT FROM existing.provider_type THEN
   RAISE EXCEPTION 'Organization identifier and category cannot be changed' USING ERRCODE='22023';
  END IF;
  target:=provider_uuid;
  UPDATE public.provider_organizations SET name=v->>'name',description=coalesce(v->>'description',''),email=lower(v->>'email'),phone=coalesce(v->>'phone',''),website=coalesce(v->>'website',''),state=v->>'state',city=v->>'city',address=v->>'address',updated_at=now() WHERE id=target;
  UPDATE public.provider_locations SET name=coalesce(nullif(v->>'primary_location_name',''),v->>'name'),address=v->>'address',city=v->>'city',state=v->>'state',phone=coalesce(v->>'phone',''),updated_at=now() WHERE provider_id=target AND is_primary;
  IF NOT FOUND THEN RAISE EXCEPTION 'Primary location missing'; END IF;
 END IF;
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id) VALUES(actor,CASE WHEN provider_uuid IS NULL THEN 'provider_draft_created' ELSE 'provider_draft_updated' END,'provider_organization',target);
 RETURN target;
END $$;
REVOKE ALL ON FUNCTION public.save_provider_draft(jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_provider_draft(jsonb,uuid) TO authenticated;
COMMENT ON FUNCTION public.save_provider_draft(jsonb,uuid) IS 'Atomic private draft registration/editing. Does not approve licenses, publish listings, change roles, or enable payments.';

COMMIT;
