BEGIN;
CREATE TABLE public.provider_services (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider_id uuid NOT NULL REFERENCES public.provider_organizations(id),
 name text NOT NULL CHECK (length(name) BETWEEN 3 AND 120),
 description text NOT NULL CHECK (length(description) BETWEEN 20 AND 3000),
 category text NOT NULL CHECK (category IN ('veterinary','grooming','diagnostics','training')),
 delivery_mode text NOT NULL CHECK (delivery_mode IN ('clinic_visit','home_visit')),
 duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 5 AND 480),
 base_price numeric(12,2) NOT NULL CHECK (base_price>=0),
 currency text NOT NULL DEFAULT 'NGN' CHECK (currency='NGN'),
 is_published boolean NOT NULL DEFAULT false,
 version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX provider_services_provider_idx ON public.provider_services(provider_id);
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.provider_services FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.provider_services TO authenticated;
GRANT ALL ON public.provider_services TO service_role;
CREATE POLICY provider_services_owner_read ON public.provider_services FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.provider_organizations o WHERE o.id=provider_id AND o.created_by=auth.uid()) OR public.is_provider_reviewer());
CREATE FUNCTION public.owns_provider_workspace(provider_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS (SELECT 1 FROM public.provider_organizations o JOIN public.profiles p ON p.user_id=o.created_by JOIN public.provider_members m ON m.provider_id=o.id AND m.user_id=o.created_by
 WHERE o.id=provider_uuid AND o.created_by=auth.uid() AND p.is_active AND m.status='active' AND m.member_role='owner')
$$;
CREATE FUNCTION public.provider_publication_eligible(provider_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS (
 SELECT 1 FROM public.provider_organizations o JOIN public.profiles p ON p.user_id=o.created_by
 JOIN public.provider_members m ON m.provider_id=o.id AND m.user_id=o.created_by
 JOIN public.provider_verification_cases c ON c.provider_id=o.id
 WHERE o.id=provider_uuid AND o.verification_status='approved' AND o.status<>'suspended' AND p.is_active AND m.status='active' AND m.member_role='owner' AND c.status='approved'
 AND cardinality(c.document_ids)>0
 AND (SELECT count(*) FROM public.provider_documents d WHERE d.provider_id=o.id AND d.id=ANY(c.document_ids) AND (d.expires_at IS NULL OR d.expires_at >= (now() AT TIME ZONE 'Africa/Lagos')::date))=cardinality(c.document_ids)
 AND (o.provider_type NOT IN ('veterinary_clinic','independent_veterinarian','mobile_service_provider','diagnostic_laboratory','pharmacy') OR EXISTS (SELECT 1 FROM public.provider_documents d WHERE d.id=ANY(c.document_ids) AND d.document_type='professional_license'))
 AND (o.provider_type NOT IN ('veterinary_clinic','independent_veterinarian','mobile_service_provider') OR public.is_verified_veterinarian(o.created_by))
 )
$$;
REVOKE ALL ON FUNCTION public.owns_provider_workspace(uuid),public.provider_publication_eligible(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.owns_provider_workspace(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.provider_publication_eligible(uuid) TO anon,authenticated;

CREATE FUNCTION public.save_provider_service(provider_uuid uuid, input jsonb, service_uuid uuid DEFAULT NULL, expected_version integer DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE org public.provider_organizations; target uuid; existing public.provider_services; category_value text;
BEGIN
 SELECT * INTO org FROM public.provider_organizations WHERE id=provider_uuid FOR UPDATE;
 IF NOT FOUND OR NOT public.owns_provider_workspace(provider_uuid) OR org.status='suspended' THEN RAISE EXCEPTION 'Service editing is unavailable' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(input) IS DISTINCT FROM 'object' OR EXISTS (SELECT 1 FROM jsonb_object_keys(input) k WHERE k NOT IN ('name','description','category','delivery_mode','duration_minutes','base_price')) THEN RAISE EXCEPTION 'Invalid service fields' USING ERRCODE='22023'; END IF;
 IF EXISTS (SELECT 1 FROM jsonb_each(input) WHERE (key IN ('duration_minutes','base_price') AND jsonb_typeof(value)<>'number') OR (key NOT IN ('duration_minutes','base_price') AND jsonb_typeof(value)<>'string')) THEN RAISE EXCEPTION 'Invalid service field types' USING ERRCODE='22023'; END IF;
 category_value:=input->>'category';
 IF NOT ((org.provider_type IN ('veterinary_clinic','independent_veterinarian','mobile_service_provider') AND category_value='veterinary') OR (org.provider_type='grooming_business' AND category_value='grooming') OR (org.provider_type='diagnostic_laboratory' AND category_value='diagnostics') OR (org.provider_type='pet_trainer' AND category_value='training')) THEN RAISE EXCEPTION 'Service category does not match this organization' USING ERRCODE='22023'; END IF;
 IF (input->>'duration_minutes')::numeric<>trunc((input->>'duration_minutes')::numeric) OR (input->>'base_price')::numeric<>round((input->>'base_price')::numeric,2) THEN RAISE EXCEPTION 'Use whole minutes and a price with at most two decimals' USING ERRCODE='22023'; END IF;
 IF service_uuid IS NULL THEN
  IF (SELECT count(*) FROM public.provider_services WHERE provider_id=provider_uuid)>=50 THEN RAISE EXCEPTION 'Service limit reached; contact support' USING ERRCODE='23514'; END IF;
  INSERT INTO public.provider_services(provider_id,name,description,category,delivery_mode,duration_minutes,base_price)
  VALUES(provider_uuid,btrim(input->>'name'),btrim(input->>'description'),category_value,input->>'delivery_mode',(input->>'duration_minutes')::integer,(input->>'base_price')::numeric) RETURNING id INTO target;
 ELSE
  SELECT * INTO existing FROM public.provider_services WHERE id=service_uuid AND provider_id=provider_uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Service unavailable' USING ERRCODE='42501'; END IF;
  IF existing.version IS DISTINCT FROM expected_version THEN RAISE EXCEPTION 'Service changed; refresh before saving' USING ERRCODE='40001'; END IF;
  IF existing.is_published THEN RAISE EXCEPTION 'Unpublish before editing public details' USING ERRCODE='22023'; END IF;
  target:=service_uuid;
  UPDATE public.provider_services SET name=btrim(input->>'name'),description=btrim(input->>'description'),category=category_value,delivery_mode=input->>'delivery_mode',duration_minutes=(input->>'duration_minutes')::integer,base_price=(input->>'base_price')::numeric,version=version+1,updated_at=now() WHERE id=target;
 END IF;
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id) VALUES(auth.uid(),CASE WHEN service_uuid IS NULL THEN 'provider_service_created' ELSE 'provider_service_updated' END,'provider_service',target);
 RETURN target;
END $$;
CREATE FUNCTION public.set_provider_service_publication(service_uuid uuid, publish boolean, expected_version integer)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE provider_uuid uuid; existing public.provider_services;
BEGIN
 SELECT provider_id INTO provider_uuid FROM public.provider_services WHERE id=service_uuid;
 PERFORM 1 FROM public.provider_organizations WHERE id=provider_uuid FOR UPDATE;
 IF NOT FOUND OR NOT public.owns_provider_workspace(provider_uuid) THEN RAISE EXCEPTION 'Service publication is unavailable' USING ERRCODE='42501'; END IF;
 SELECT * INTO existing FROM public.provider_services WHERE id=service_uuid FOR UPDATE;
 IF existing.version IS DISTINCT FROM expected_version THEN RAISE EXCEPTION 'Service changed; refresh before publishing' USING ERRCODE='40001'; END IF;
 IF publish IS NULL THEN RAISE EXCEPTION 'Publication choice required' USING ERRCODE='22023'; END IF;
 IF publish AND NOT public.provider_publication_eligible(provider_uuid) THEN RAISE EXCEPTION 'Current organization approval and credentials are required' USING ERRCODE='42501'; END IF;
 IF publish AND NOT EXISTS (SELECT 1 FROM public.provider_locations WHERE provider_id=provider_uuid AND is_primary) THEN RAISE EXCEPTION 'Primary location missing' USING ERRCODE='22023'; END IF;
 IF existing.is_published=publish THEN RETURN service_uuid; END IF;
 UPDATE public.provider_services SET is_published=publish,version=version+1,updated_at=now() WHERE id=service_uuid;
 IF publish THEN
  UPDATE public.provider_organizations SET status='active',updated_at=now() WHERE id=provider_uuid;
  UPDATE public.provider_locations SET is_active=true,updated_at=now() WHERE provider_id=provider_uuid AND is_primary;
 ELSIF NOT EXISTS (SELECT 1 FROM public.provider_services WHERE provider_id=provider_uuid AND is_published) THEN
  UPDATE public.provider_organizations SET status='inactive',updated_at=now() WHERE id=provider_uuid AND status<>'suspended';
  UPDATE public.provider_locations SET is_active=false,updated_at=now() WHERE provider_id=provider_uuid;
 END IF;
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id) VALUES(auth.uid(),CASE WHEN publish THEN 'provider_service_published' ELSE 'provider_service_unpublished' END,'provider_service',service_uuid);
 RETURN service_uuid;
END $$;
REVOKE ALL ON FUNCTION public.save_provider_service(uuid,jsonb,uuid,integer),public.set_provider_service_publication(uuid,boolean,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_provider_service(uuid,jsonb,uuid,integer),public.set_provider_service_publication(uuid,boolean,integer) TO authenticated;
CREATE VIEW public.provider_service_catalog WITH (security_barrier=true) AS
 SELECT s.id,s.provider_id,s.name,s.description,s.category,s.delivery_mode,s.duration_minutes,s.base_price,s.currency,s.updated_at,
 o.name AS organization_name,o.slug AS provider_slug,o.provider_type,l.city,l.state,l.country
 FROM public.provider_services s JOIN public.provider_organizations o ON o.id=s.provider_id
 JOIN public.provider_locations l ON l.provider_id=o.id AND l.is_primary AND l.is_active
 WHERE s.is_published AND o.status='active' AND public.provider_publication_eligible(o.id);
REVOKE ALL ON public.provider_service_catalog FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.provider_service_catalog TO anon,authenticated;
COMMIT;
