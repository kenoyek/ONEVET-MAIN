BEGIN;
-- Organization approval is independent of individual professional licensing and publication.
CREATE TABLE public.provider_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider_id uuid NOT NULL REFERENCES public.provider_organizations(id),
 document_type text NOT NULL CHECK (document_type IN ('business_registration','professional_license','supporting_document')),
 file_path text NOT NULL UNIQUE,
 expires_at date,
 is_current boolean NOT NULL DEFAULT true,
 uploaded_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX provider_documents_provider_idx ON public.provider_documents(provider_id);
CREATE TABLE public.provider_verification_cases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider_id uuid NOT NULL UNIQUE REFERENCES public.provider_organizations(id),
 status text NOT NULL CHECK (status IN ('submitted','under_review','more_info_required','approved','rejected','suspended')),
 revision integer NOT NULL DEFAULT 1,
 submitted_at timestamptz NOT NULL DEFAULT now(),
 reviewed_by uuid REFERENCES auth.users(id),
 feedback text NOT NULL DEFAULT '' CHECK (length(feedback)<=3000),
 document_ids uuid[] NOT NULL,
 organization_snapshot jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.provider_verification_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider_id uuid NOT NULL REFERENCES public.provider_organizations(id),
 case_id uuid NOT NULL REFERENCES public.provider_verification_cases(id),
 actor_id uuid NOT NULL REFERENCES auth.users(id),
 status text NOT NULL,
 feedback text NOT NULL DEFAULT '',
 revision integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_verification_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_verification_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.provider_documents,public.provider_verification_cases,public.provider_verification_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.provider_documents,public.provider_verification_cases,public.provider_verification_events TO authenticated;
GRANT ALL ON public.provider_documents,public.provider_verification_cases,public.provider_verification_events TO service_role;
CREATE FUNCTION public.is_provider_reviewer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.has_role(auth.uid(),'admin') AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND is_active)
$$;
REVOKE ALL ON FUNCTION public.is_provider_reviewer() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_provider_reviewer() TO authenticated;
CREATE POLICY provider_admin_organization_read ON public.provider_organizations FOR SELECT TO authenticated USING (public.is_provider_reviewer());
CREATE POLICY provider_admin_location_read ON public.provider_locations FOR SELECT TO authenticated USING (public.is_provider_reviewer());
CREATE POLICY provider_documents_read ON public.provider_documents FOR SELECT TO authenticated USING (public.is_provider_reviewer() OR EXISTS (SELECT 1 FROM public.provider_organizations o WHERE o.id=provider_id AND o.created_by=auth.uid()));
CREATE POLICY provider_cases_read ON public.provider_verification_cases FOR SELECT TO authenticated USING (public.is_provider_reviewer() OR EXISTS (SELECT 1 FROM public.provider_organizations o WHERE o.id=provider_id AND o.created_by=auth.uid()));
CREATE POLICY provider_events_read ON public.provider_verification_events FOR SELECT TO authenticated USING (public.is_provider_reviewer() OR EXISTS (SELECT 1 FROM public.provider_organizations o WHERE o.id=provider_id AND o.created_by=auth.uid()));

CREATE FUNCTION public.can_edit_provider_evidence(provider_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS (SELECT 1 FROM public.provider_organizations o JOIN public.profiles p ON p.user_id=o.created_by JOIN public.provider_members m ON m.provider_id=o.id AND m.user_id=o.created_by
 WHERE o.id=provider_uuid AND o.created_by=auth.uid() AND p.is_active AND m.member_role='owner' AND m.status='active' AND o.status<>'suspended' AND o.verification_status IN ('draft','more_info_required','rejected'))
$$;
CREATE FUNCTION public.can_upload_provider_evidence(object_name text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF object_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|jpg|png)$' THEN RETURN false; END IF;
 RETURN public.can_edit_provider_evidence(split_part(object_name,'/',1)::uuid);
END $$;
REVOKE ALL ON FUNCTION public.can_edit_provider_evidence(uuid),public.can_upload_provider_evidence(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_edit_provider_evidence(uuid),public.can_upload_provider_evidence(text) TO authenticated;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('provider-credentials','provider-credentials',false,10485760,ARRAY['application/pdf','image/jpeg','image/png']);
CREATE POLICY provider_evidence_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='provider-credentials' AND public.can_upload_provider_evidence(name));
CREATE POLICY provider_evidence_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id='provider-credentials' AND (public.is_provider_reviewer() OR EXISTS (SELECT 1 FROM public.provider_organizations o WHERE o.id::text=split_part(name,'/',1) AND o.created_by=auth.uid())));
-- No client UPDATE or DELETE policy: registered evidence and historical submissions stay immutable.

CREATE FUNCTION public.register_provider_evidence(provider_uuid uuid, kind text, object_path text, expiry date DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid;
BEGIN
 PERFORM 1 FROM public.provider_organizations WHERE id=provider_uuid FOR UPDATE;
 IF NOT public.can_edit_provider_evidence(provider_uuid) OR NOT public.can_upload_provider_evidence(object_path) OR split_part(object_path,'/',1)<>provider_uuid::text THEN RAISE EXCEPTION 'Evidence upload not permitted' USING ERRCODE='42501'; END IF;
 IF expiry IS NOT NULL AND expiry<current_date THEN RAISE EXCEPTION 'Document is expired' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='provider-credentials' AND name=object_path) THEN RAISE EXCEPTION 'Upload the document before registering it' USING ERRCODE='22023'; END IF;
 -- Retrying a successful registration is safe after a lost response.
 SELECT id INTO target FROM public.provider_documents WHERE file_path=object_path AND provider_id=provider_uuid AND document_type=kind AND expires_at IS NOT DISTINCT FROM expiry;
 IF FOUND THEN RETURN target; END IF;
 IF (SELECT count(*) FROM public.provider_documents WHERE provider_id=provider_uuid)>=50 THEN RAISE EXCEPTION 'Document limit reached; contact support' USING ERRCODE='23514'; END IF;
 UPDATE public.provider_documents SET is_current=false WHERE provider_id=provider_uuid AND document_type=kind AND is_current;
 INSERT INTO public.provider_documents(provider_id,document_type,file_path,expires_at,uploaded_by) VALUES(provider_uuid,kind,object_path,expiry,auth.uid()) RETURNING id INTO target;
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id) VALUES(auth.uid(),'provider_evidence_registered','provider_organization',provider_uuid);
 RETURN target;
END $$;

CREATE FUNCTION public.submit_provider_verification(provider_uuid uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE org public.provider_organizations; target uuid; docs uuid[]; next_revision integer;
BEGIN
 SELECT * INTO org FROM public.provider_organizations WHERE id=provider_uuid FOR UPDATE;
 IF NOT FOUND OR NOT public.can_edit_provider_evidence(provider_uuid) THEN RAISE EXCEPTION 'Submission not permitted' USING ERRCODE='42501'; END IF;
 SELECT array_agg(id ORDER BY created_at,id) INTO docs FROM public.provider_documents WHERE provider_id=provider_uuid AND is_current AND (expires_at IS NULL OR expires_at>=current_date);
 IF coalesce(cardinality(docs),0)=0 THEN RAISE EXCEPTION 'Upload current registration evidence before submitting' USING ERRCODE='22023'; END IF;
 INSERT INTO public.provider_verification_cases(provider_id,status,document_ids,organization_snapshot)
 VALUES(provider_uuid,'submitted',docs,to_jsonb(org))
 ON CONFLICT(provider_id) DO UPDATE SET status='submitted',revision=provider_verification_cases.revision+1,submitted_at=now(),reviewed_by=NULL,feedback='',document_ids=EXCLUDED.document_ids,organization_snapshot=EXCLUDED.organization_snapshot,updated_at=now()
 RETURNING id,revision INTO target,next_revision;
 UPDATE public.provider_organizations SET verification_status='submitted',status='inactive',updated_at=now() WHERE id=provider_uuid;
 INSERT INTO public.provider_verification_events(provider_id,case_id,actor_id,status,revision) VALUES(provider_uuid,target,auth.uid(),'submitted',next_revision);
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id) VALUES(auth.uid(),'provider_verification_submitted','provider_organization',provider_uuid);
 RETURN target;
END $$;

CREATE FUNCTION public.review_provider_verification(provider_uuid uuid, expected_revision integer, decision text, owner_feedback text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE org public.provider_organizations; review public.provider_verification_cases; note text:=btrim(coalesce(owner_feedback,''));
BEGIN
 IF NOT public.is_provider_reviewer() OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND is_active) THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
 SELECT * INTO org FROM public.provider_organizations WHERE id=provider_uuid FOR UPDATE;
 IF NOT FOUND OR org.created_by=auth.uid() THEN RAISE EXCEPTION 'Independent review required' USING ERRCODE='42501'; END IF;
 SELECT * INTO review FROM public.provider_verification_cases WHERE provider_id=provider_uuid FOR UPDATE;
 IF NOT FOUND OR review.revision IS DISTINCT FROM expected_revision THEN RAISE EXCEPTION 'Review changed; refresh before deciding' USING ERRCODE='40001'; END IF;
 IF decision IS NULL OR NOT ((review.status='submitted' AND decision IN ('under_review','more_info_required','rejected','approved')) OR (review.status='under_review' AND decision IN ('more_info_required','rejected','approved')) OR (review.status='approved' AND decision='suspended')) THEN RAISE EXCEPTION 'Invalid verification transition' USING ERRCODE='22023'; END IF;
 IF length(note)>3000 OR (decision IN ('more_info_required','rejected','suspended') AND length(note)<10) THEN RAISE EXCEPTION 'Provide a clear explanation for the owner (10–3000 characters)' USING ERRCODE='22023'; END IF;
 IF decision='approved' THEN
  IF NOT EXISTS (SELECT 1 FROM public.provider_documents WHERE id=ANY(review.document_ids)) OR EXISTS (SELECT 1 FROM public.provider_documents WHERE id=ANY(review.document_ids) AND expires_at<current_date) THEN RAISE EXCEPTION 'Submitted evidence is missing or expired' USING ERRCODE='22023'; END IF;
  IF org.provider_type IN ('veterinary_clinic','independent_veterinarian','mobile_service_provider','diagnostic_laboratory','pharmacy') AND NOT EXISTS (SELECT 1 FROM public.provider_documents WHERE id=ANY(review.document_ids) AND document_type='professional_license') THEN RAISE EXCEPTION 'Professional license evidence is required for this category' USING ERRCODE='22023'; END IF;
  IF org.provider_type IN ('veterinary_clinic','independent_veterinarian','mobile_service_provider') AND NOT public.is_verified_veterinarian(org.created_by) THEN RAISE EXCEPTION 'The owner must complete individual veterinary verification first' USING ERRCODE='22023'; END IF;
 END IF;
 UPDATE public.provider_verification_cases SET status=decision,revision=revision+1,reviewed_by=auth.uid(),feedback=note,updated_at=now() WHERE id=review.id;
 -- Organization review never publishes services or promotes individual credentials.
 UPDATE public.provider_organizations SET verification_status=decision,status=CASE WHEN decision='suspended' THEN 'suspended' ELSE 'inactive' END,updated_at=now() WHERE id=provider_uuid;
 UPDATE public.provider_locations SET is_active=false WHERE provider_id=provider_uuid;
 INSERT INTO public.provider_verification_events(provider_id,case_id,actor_id,status,feedback,revision) VALUES(provider_uuid,review.id,auth.uid(),decision,note,review.revision+1);
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id,details) VALUES(auth.uid(),'provider_verification_reviewed','provider_organization',provider_uuid,jsonb_build_object('status',decision,'revision',review.revision+1));
 RETURN review.id;
END $$;
REVOKE ALL ON FUNCTION public.register_provider_evidence(uuid,text,text,date),public.submit_provider_verification(uuid),public.review_provider_verification(uuid,integer,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.register_provider_evidence(uuid,text,text,date),public.submit_provider_verification(uuid),public.review_provider_verification(uuid,integer,text,text) TO authenticated;

-- Owners may correct returned applications before resubmission.
CREATE OR REPLACE FUNCTION public.save_provider_draft(input jsonb, provider_uuid uuid DEFAULT NULL)
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
  IF NOT FOUND OR existing.verification_status NOT IN ('draft','more_info_required','rejected') OR existing.status='suspended' OR NOT EXISTS (
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

COMMIT;
