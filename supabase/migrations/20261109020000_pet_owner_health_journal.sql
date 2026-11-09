BEGIN;
-- Owner observations are deliberately separate from clinician-authored medical records.
CREATE TABLE public.pet_owner_health_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
 recorded_by uuid NOT NULL REFERENCES auth.users(id), client_nonce uuid NOT NULL,
 entry_type text NOT NULL CHECK(entry_type IN ('weight','vaccination','note')),
 occurred_on date NOT NULL, title text NOT NULL CHECK(length(title) BETWEEN 1 AND 120 AND title ~ '[^[:space:]]'),
 weight_kg numeric, next_due_on date, notes text NOT NULL DEFAULT '' CHECK(length(notes)<=2000),
 created_at timestamptz NOT NULL DEFAULT now(), voided_at timestamptz, void_reason text,
 UNIQUE(recorded_by,client_nonce),
 CHECK((entry_type='weight' AND weight_kg IS NOT NULL AND weight_kg>0 AND weight_kg<=10000 AND weight_kg<>'NaN'::numeric AND next_due_on IS NULL) OR (entry_type IN ('vaccination','note') AND weight_kg IS NULL)),
 CHECK(entry_type='vaccination' OR next_due_on IS NULL), CHECK(next_due_on IS NULL OR next_due_on>=occurred_on),
 CHECK((voided_at IS NULL AND void_reason IS NULL) OR (voided_at IS NOT NULL AND length(void_reason) BETWEEN 5 AND 500 AND void_reason ~ '[^[:space:]]'))
);
CREATE INDEX pet_owner_journal_page_idx ON public.pet_owner_health_entries(pet_id,occurred_on DESC,created_at DESC,id);
CREATE INDEX pet_owner_journal_rate_idx ON public.pet_owner_health_entries(recorded_by,created_at);
CREATE FUNCTION public.can_manage_pet_health_journal(pet_uuid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.pets p JOIN public.profiles pr ON pr.id=p.owner_id AND pr.user_id=auth.uid() AND pr.is_active WHERE p.id=pet_uuid)
$$;
REVOKE ALL ON FUNCTION public.can_manage_pet_health_journal(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_pet_health_journal(uuid) TO authenticated;
ALTER TABLE public.pet_owner_health_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pet_owner_health_entries FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.pet_owner_health_entries TO authenticated;
GRANT ALL ON public.pet_owner_health_entries TO service_role;
CREATE POLICY owner_journal_read ON public.pet_owner_health_entries FOR SELECT TO authenticated USING(public.can_manage_pet_health_journal(pet_id));
CREATE FUNCTION public.add_pet_owner_health_entry(pet_uuid uuid, entry_kind text, event_date date, entry_title text, entry_notes text, weight_value numeric, due_date date, request_key uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); profile_uuid uuid; prior public.pet_owner_health_entries; result uuid;
 clean_title text:=btrim(entry_title); clean_notes text:=btrim(coalesce(entry_notes,''));
BEGIN
 SELECT id INTO profile_uuid FROM public.profiles WHERE user_id=actor AND is_active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active owner account required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.pets WHERE id=pet_uuid AND owner_id=profile_uuid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pet journal unavailable' USING ERRCODE='42501'; END IF;
 IF request_key IS NULL OR entry_kind IS NULL OR entry_kind NOT IN ('weight','vaccination','note') OR event_date IS NULL OR event_date>(now() AT TIME ZONE 'Africa/Lagos')::date OR event_date<date '1900-01-01'
 OR clean_title IS NULL OR length(clean_title) NOT BETWEEN 1 AND 120 OR clean_title !~ '[^[:space:]]' OR length(clean_notes)>2000
 OR (entry_kind='weight' AND (weight_value IS NULL OR weight_value<=0 OR weight_value>10000 OR weight_value='NaN'::numeric OR due_date IS NOT NULL))
 OR (entry_kind<>'weight' AND weight_value IS NOT NULL) OR (entry_kind<>'vaccination' AND due_date IS NOT NULL) OR (due_date IS NOT NULL AND due_date<event_date) THEN
  RAISE EXCEPTION 'Check journal type, date, text, weight and due date' USING ERRCODE='22023';
 END IF;
 SELECT * INTO prior FROM public.pet_owner_health_entries WHERE recorded_by=actor AND client_nonce=request_key;
 IF FOUND THEN
  IF prior.pet_id=pet_uuid AND prior.entry_type=entry_kind AND prior.occurred_on=event_date AND prior.title=clean_title AND prior.notes=clean_notes AND prior.weight_kg IS NOT DISTINCT FROM weight_value AND prior.next_due_on IS NOT DISTINCT FROM due_date THEN RETURN prior.id; END IF;
  RAISE EXCEPTION 'Request key already used for different content' USING ERRCODE='22023';
 END IF;
 IF (SELECT count(*) FROM public.pet_owner_health_entries WHERE recorded_by=actor AND created_at>now()-interval '1 day')>=50 THEN RAISE EXCEPTION 'Daily journal limit reached' USING ERRCODE='23514'; END IF;
 INSERT INTO public.pet_owner_health_entries(pet_id,recorded_by,client_nonce,entry_type,occurred_on,title,notes,weight_kg,next_due_on)
 VALUES(pet_uuid,actor,request_key,entry_kind,event_date,clean_title,clean_notes,weight_value,due_date) RETURNING id INTO result;
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id,details) VALUES(actor,'pet_owner_health_entry_added','pet',pet_uuid,jsonb_build_object('entry_id',result));
 RETURN result;
END $$;
CREATE FUNCTION public.void_pet_owner_health_entry(entry_uuid uuid, reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); profile_uuid uuid; pet_uuid uuid; clean_reason text:=btrim(reason);
BEGIN
 SELECT id INTO profile_uuid FROM public.profiles WHERE user_id=actor AND is_active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active owner account required' USING ERRCODE='42501'; END IF;
 SELECT pet_id INTO pet_uuid FROM public.pet_owner_health_entries WHERE id=entry_uuid;
 PERFORM 1 FROM public.pets WHERE id=pet_uuid AND owner_id=profile_uuid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pet journal unavailable' USING ERRCODE='42501'; END IF;
 IF clean_reason IS NULL OR length(clean_reason) NOT BETWEEN 5 AND 500 OR clean_reason !~ '[^[:space:]]' THEN RAISE EXCEPTION 'Explain the correction in 5–500 characters' USING ERRCODE='22023'; END IF;
 -- Preserve original content and the first correction reason; safe to retry after a lost response.
 UPDATE public.pet_owner_health_entries SET voided_at=now(),void_reason=clean_reason WHERE id=entry_uuid AND voided_at IS NULL;
 IF FOUND THEN INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id,details) VALUES(actor,'pet_owner_health_entry_voided','pet',pet_uuid,jsonb_build_object('entry_id',entry_uuid)); END IF;
END $$;
REVOKE ALL ON FUNCTION public.add_pet_owner_health_entry(uuid,text,date,text,text,numeric,date,uuid),public.void_pet_owner_health_entry(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.add_pet_owner_health_entry(uuid,text,date,text,text,numeric,date,uuid),public.void_pet_owner_health_entry(uuid,text) TO authenticated;
COMMIT;
