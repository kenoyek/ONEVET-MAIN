BEGIN;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
SET LOCAL search_path=public,extensions;
CREATE TABLE public.provider_booking_settings (
 provider_id uuid PRIMARY KEY REFERENCES public.provider_organizations(id),
 enabled boolean NOT NULL DEFAULT false, weekly jsonb NOT NULL DEFAULT '[]', closed_dates date[] NOT NULL DEFAULT '{}',
 version integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.provider_booking_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider_id uuid NOT NULL REFERENCES public.provider_organizations(id),
 provider_owner_id uuid NOT NULL REFERENCES auth.users(id), service_id uuid NOT NULL REFERENCES public.provider_services(id),
 customer_id uuid NOT NULL REFERENCES auth.users(id), request_key uuid NOT NULL,
 pet_id uuid REFERENCES public.pets(id), batch_id uuid REFERENCES public.livestock_batches(id),
 animal_snapshot jsonb NOT NULL, service_snapshot jsonb NOT NULL,
 start_at timestamptz NOT NULL, end_at timestamptz NOT NULL CHECK (end_at>start_at),
 base_fee numeric(12,2) NOT NULL CHECK (base_fee>=0), currency text NOT NULL DEFAULT 'NGN' CHECK (currency='NGN'),
 contact_phone text NOT NULL, visit_address text NOT NULL DEFAULT '', provider_address text,
 customer_notes text NOT NULL DEFAULT '', response_note text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','declined','cancelled','completed')),
 version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((pet_id IS NOT NULL)::integer+(batch_id IS NOT NULL)::integer=1), UNIQUE(customer_id,request_key),
 EXCLUDE USING gist (provider_id WITH =,tstzrange(start_at,end_at,'[)') WITH &&) WHERE (status='confirmed'),
 EXCLUDE USING gist (provider_owner_id WITH =,tstzrange(start_at,end_at,'[)') WITH &&) WHERE (status='confirmed'),
 EXCLUDE USING gist (customer_id WITH =,tstzrange(start_at,end_at,'[)') WITH &&) WHERE (status='confirmed')
);
CREATE INDEX provider_booking_customer_idx ON public.provider_booking_requests(customer_id,start_at);
CREATE INDEX provider_booking_provider_idx ON public.provider_booking_requests(provider_id,start_at);
CREATE TABLE public.provider_booking_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid NOT NULL REFERENCES public.provider_booking_requests(id),
 actor_id uuid NOT NULL REFERENCES auth.users(id), status text NOT NULL, note text NOT NULL DEFAULT '',
 version integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(booking_id,version)
);
ALTER TABLE public.provider_booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_booking_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.provider_booking_settings,public.provider_booking_requests,public.provider_booking_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.provider_booking_settings,public.provider_booking_requests,public.provider_booking_events TO authenticated;
GRANT ALL ON public.provider_booking_settings,public.provider_booking_requests,public.provider_booking_events TO service_role;
CREATE POLICY booking_settings_owner_read ON public.provider_booking_settings FOR SELECT TO authenticated USING (public.owns_provider_workspace(provider_id) OR public.is_provider_reviewer());
CREATE POLICY booking_participant_read ON public.provider_booking_requests FOR SELECT TO authenticated USING (customer_id=auth.uid() OR public.owns_provider_workspace(provider_id) OR public.is_provider_reviewer());
CREATE POLICY booking_events_participant_read ON public.provider_booking_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.provider_booking_requests b WHERE b.id=booking_id));

CREATE FUNCTION public.save_provider_booking_schedule(provider_uuid uuid, enabled boolean, weekly jsonb, closed_dates date[], expected_version integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE day jsonb; actual_version integer; d integer; opens integer; closes integer;
BEGIN
 PERFORM 1 FROM public.provider_organizations WHERE id=provider_uuid AND status<>'suspended' FOR UPDATE;
 IF NOT FOUND OR NOT public.owns_provider_workspace(provider_uuid) THEN RAISE EXCEPTION 'Schedule editing unavailable' USING ERRCODE='42501'; END IF;
 SELECT version INTO actual_version FROM public.provider_booking_settings WHERE provider_id=provider_uuid;
 IF coalesce(actual_version,0) IS DISTINCT FROM expected_version THEN RAISE EXCEPTION 'Schedule changed; refresh' USING ERRCODE='40001'; END IF;
 IF enabled IS NULL OR jsonb_typeof(weekly) IS DISTINCT FROM 'array' OR jsonb_array_length(weekly)>7 OR closed_dates IS NULL OR cardinality(closed_dates)>60 OR array_position(closed_dates,NULL) IS NOT NULL THEN RAISE EXCEPTION 'Invalid schedule' USING ERRCODE='22023'; END IF;
 FOR day IN SELECT value FROM jsonb_array_elements(weekly) LOOP
  IF jsonb_typeof(day) IS DISTINCT FROM 'object' OR EXISTS (SELECT 1 FROM jsonb_object_keys(day) k WHERE k NOT IN ('weekday','opens','closes')) OR NOT (day ?& ARRAY['weekday','opens','closes']) OR EXISTS (SELECT 1 FROM jsonb_each(day) WHERE jsonb_typeof(value)<>'number' OR (value::text)::numeric<>trunc((value::text)::numeric)) THEN RAISE EXCEPTION 'Invalid weekday window' USING ERRCODE='22023'; END IF;
  d:=(day->>'weekday')::integer; opens:=(day->>'opens')::integer; closes:=(day->>'closes')::integer;
  IF d NOT BETWEEN 0 AND 6 OR opens<0 OR closes>1440 OR closes<=opens OR opens%15<>0 OR closes%15<>0 THEN RAISE EXCEPTION 'Use one non-overnight window per day on 15-minute boundaries' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF (SELECT count(*)<>count(DISTINCT value->>'weekday') FROM jsonb_array_elements(weekly)) OR (enabled AND jsonb_array_length(weekly)=0) THEN RAISE EXCEPTION 'Choose distinct opening days' USING ERRCODE='22023'; END IF;
 IF enabled AND NOT public.provider_publication_eligible(provider_uuid) THEN RAISE EXCEPTION 'Current approval required to accept requests' USING ERRCODE='42501'; END IF;
 INSERT INTO public.provider_booking_settings(provider_id,enabled,weekly,closed_dates) VALUES(provider_uuid,enabled,weekly,closed_dates)
 ON CONFLICT(provider_id) DO UPDATE SET enabled=EXCLUDED.enabled,weekly=EXCLUDED.weekly,closed_dates=EXCLUDED.closed_dates,version=provider_booking_settings.version+1,updated_at=now() RETURNING version INTO actual_version;
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id) VALUES(auth.uid(),'provider_booking_schedule_saved','provider_organization',provider_uuid);
 RETURN actual_version;
END $$;

CREATE FUNCTION public.get_provider_booking_slots(service_uuid uuid, local_date date)
RETURNS TABLE(start_at timestamptz,end_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 WITH windows AS (
  SELECT s.duration_minutes,o.created_by,config.weekly FROM public.provider_services s JOIN public.provider_organizations o ON o.id=s.provider_id
  JOIN public.provider_booking_settings config ON config.provider_id=o.id AND config.enabled
  WHERE s.id=service_uuid AND EXISTS(SELECT 1 FROM public.provider_service_catalog c WHERE c.id=s.id)
  AND local_date BETWEEN (now() AT TIME ZONE 'Africa/Lagos')::date AND (now() AT TIME ZONE 'Africa/Lagos')::date+90 AND NOT (local_date=ANY(config.closed_dates))
 ), candidates AS (
  SELECT ((local_date::timestamp+make_interval(mins=>minute)) AT TIME ZONE 'Africa/Lagos') AS starts, duration_minutes,created_by
  FROM windows CROSS JOIN LATERAL jsonb_array_elements(weekly) day
  CROSS JOIN LATERAL generate_series((day->>'opens')::integer,(day->>'closes')::integer-duration_minutes,15) minute
  WHERE (day->>'weekday')::integer=extract(dow FROM local_date)::integer
 ) SELECT starts,starts+make_interval(mins=>duration_minutes) FROM candidates
 WHERE starts>=now()+interval '30 minutes' AND NOT EXISTS (
  SELECT 1 FROM public.provider_booking_requests b WHERE b.provider_owner_id=candidates.created_by AND b.status='confirmed'
  AND tstzrange(b.start_at,b.end_at,'[)') && tstzrange(starts,starts+make_interval(mins=>duration_minutes),'[)')
 ) ORDER BY starts
$$;

CREATE FUNCTION public.request_provider_booking(service_uuid uuid, expected_service_version integer, start_time timestamptz, request_key uuid,
 animal_pet uuid DEFAULT NULL, animal_batch uuid DEFAULT NULL, contact_phone text DEFAULT '', visit_address text DEFAULT '', customer_notes text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); org public.provider_organizations; svc public.provider_services; existing public.provider_booking_requests; target uuid; animal jsonb; finish timestamptz; phone text:=btrim(contact_phone); address text:=btrim(visit_address); notes text:=btrim(customer_notes);
BEGIN
 PERFORM 1 FROM public.profiles WHERE user_id=actor AND is_active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active customer account required' USING ERRCODE='42501'; END IF;
 SELECT * INTO existing FROM public.provider_booking_requests b WHERE b.customer_id=actor AND b.request_key=request_provider_booking.request_key;
 IF FOUND THEN
  IF existing.service_id=service_uuid AND existing.start_at=start_time AND existing.pet_id IS NOT DISTINCT FROM animal_pet AND existing.batch_id IS NOT DISTINCT FROM animal_batch AND existing.contact_phone=phone AND existing.visit_address=address AND existing.customer_notes=notes THEN RETURN existing.id; END IF;
  RAISE EXCEPTION 'Request key already used for different details' USING ERRCODE='22023';
 END IF;
 SELECT * INTO svc FROM public.provider_services WHERE id=service_uuid;
 SELECT * INTO org FROM public.provider_organizations WHERE id=svc.provider_id FOR UPDATE;
 -- Re-read after the organization lock so a concurrent price/publication change cannot be missed.
 SELECT * INTO svc FROM public.provider_services WHERE id=service_uuid;
 IF org.id IS NULL OR org.created_by=actor OR NOT EXISTS(SELECT 1 FROM public.provider_service_catalog WHERE id=service_uuid) THEN RAISE EXCEPTION 'Service unavailable' USING ERRCODE='42501'; END IF;
 IF svc.version IS DISTINCT FROM expected_service_version THEN RAISE EXCEPTION 'Service changed; review current details' USING ERRCODE='40001'; END IF;
 IF request_key IS NULL OR phone IS NULL OR length(phone) NOT BETWEEN 7 AND 40 OR notes IS NULL OR length(notes)>2000 OR address IS NULL OR length(address)>500 OR (svc.delivery_mode='home_visit' AND length(address)<10) OR (svc.delivery_mode<>'home_visit' AND address<>'') THEN RAISE EXCEPTION 'Check contact, address and request notes' USING ERRCODE='22023'; END IF;
 IF (animal_pet IS NOT NULL)::integer+(animal_batch IS NOT NULL)::integer<>1 THEN RAISE EXCEPTION 'Choose one owned animal or group' USING ERRCODE='22023'; END IF;
 IF animal_pet IS NOT NULL THEN
  SELECT jsonb_build_object('kind','pet','name',p.name,'species',p.species) INTO animal FROM public.pets p WHERE p.id=animal_pet AND p.owner_id=public.get_profile_id(actor);
 ELSE
  IF svc.category NOT IN ('veterinary','diagnostics') THEN RAISE EXCEPTION 'This service does not accept farm groups' USING ERRCODE='22023'; END IF;
  SELECT jsonb_build_object('kind','farm_group','name',b.batch_code,'species',b.species) INTO animal FROM public.livestock_batches b JOIN public.livestock_farms f ON f.id=b.farm_id WHERE b.id=animal_batch AND f.owner_id=public.get_profile_id(actor) AND b.status IN ('active','quarantined');
 END IF;
 IF animal IS NULL THEN RAISE EXCEPTION 'Animal unavailable for this account' USING ERRCODE='42501'; END IF;
 SELECT end_at INTO finish FROM public.get_provider_booking_slots(service_uuid,(start_time AT TIME ZONE 'Africa/Lagos')::date) WHERE start_at=start_time;
 IF finish IS NULL THEN RAISE EXCEPTION 'Slot unavailable; refresh times' USING ERRCODE='23P01'; END IF;
 IF (SELECT count(*) FROM public.provider_booking_requests WHERE customer_id=actor AND status='pending' AND start_at>now())>=20 OR (SELECT count(*) FROM public.provider_booking_requests WHERE customer_id=actor AND provider_id=org.id AND status='pending' AND start_at>now())>=5 THEN RAISE EXCEPTION 'Pending request limit reached; manage existing requests' USING ERRCODE='23514'; END IF;
 INSERT INTO public.provider_booking_requests(provider_id,provider_owner_id,service_id,customer_id,request_key,pet_id,batch_id,animal_snapshot,service_snapshot,start_at,end_at,base_fee,contact_phone,visit_address,customer_notes)
 VALUES(org.id,org.created_by,svc.id,actor,request_key,animal_pet,animal_batch,animal,jsonb_build_object('name',svc.name,'category',svc.category,'delivery_mode',svc.delivery_mode,'duration_minutes',svc.duration_minutes,'organization_name',org.name,'provider_slug',org.slug,'city',org.city,'state',org.state,'service_version',svc.version),start_time,finish,svc.base_price,phone,address,notes) RETURNING id INTO target;
 INSERT INTO public.provider_booking_events(booking_id,actor_id,status,version) VALUES(target,actor,'pending',1);
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id) VALUES(actor,'provider_booking_requested','provider_booking',target);
 INSERT INTO public.notifications(user_id,title,message,link) VALUES(org.created_by,'New booking request','A customer requested a service. Review it in your organization workspace.','/provider/organization/'||org.slug);
 RETURN target;
END $$;

CREATE FUNCTION public.respond_provider_booking(booking_uuid uuid, expected_version integer, decision text, response_note text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE b public.provider_booking_requests; provider_uuid uuid; actor uuid:=auth.uid(); owner boolean; note text:=btrim(coalesce(response_note,'')); primary_address text;
BEGIN
 SELECT provider_id INTO provider_uuid FROM public.provider_booking_requests WHERE id=booking_uuid;
 PERFORM 1 FROM public.provider_organizations WHERE id=provider_uuid FOR UPDATE;
 SELECT * INTO b FROM public.provider_booking_requests WHERE id=booking_uuid FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=actor AND is_active) THEN RAISE EXCEPTION 'Booking unavailable' USING ERRCODE='42501'; END IF;
 owner:=public.owns_provider_workspace(provider_uuid);
 IF NOT (owner OR b.customer_id=actor OR public.is_provider_reviewer()) THEN RAISE EXCEPTION 'Booking unavailable' USING ERRCODE='42501'; END IF;
 IF b.version IS DISTINCT FROM expected_version THEN RAISE EXCEPTION 'Booking changed; refresh' USING ERRCODE='40001'; END IF;
 IF length(note)>2000 OR (decision IN ('declined','cancelled') AND length(note)<5) THEN RAISE EXCEPTION 'Explain the decision (5–2000 characters)' USING ERRCODE='22023'; END IF;
 IF decision IS NULL OR NOT ((decision='cancelled' AND b.status IN ('pending','confirmed')) OR (owner AND decision IN ('confirmed','declined') AND b.status='pending') OR (owner AND decision='completed' AND b.status='confirmed' AND b.end_at<=now())) THEN RAISE EXCEPTION 'Invalid booking transition' USING ERRCODE='42501'; END IF;
 IF decision='confirmed' THEN
  IF NOT public.provider_publication_eligible(provider_uuid) OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=b.customer_id AND is_active) OR NOT EXISTS (SELECT 1 FROM public.get_provider_booking_slots(b.service_id,(b.start_at AT TIME ZONE 'Africa/Lagos')::date) WHERE start_at=b.start_at AND end_at=b.end_at) THEN RAISE EXCEPTION 'Slot or service unavailable; refresh' USING ERRCODE='23P01'; END IF;
  IF (SELECT (service_snapshot->>'service_version')::integer FROM public.provider_booking_requests WHERE id=b.id) IS DISTINCT FROM (SELECT version FROM public.provider_services WHERE id=b.service_id) THEN RAISE EXCEPTION 'Service changed; customer must submit a new request' USING ERRCODE='40001'; END IF;
  IF NOT ((b.pet_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.pets WHERE id=b.pet_id AND owner_id=public.get_profile_id(b.customer_id))) OR (b.batch_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.livestock_batches batches JOIN public.livestock_farms farms ON farms.id=batches.farm_id WHERE batches.id=b.batch_id AND farms.owner_id=public.get_profile_id(b.customer_id) AND batches.status IN ('active','quarantined')))) THEN RAISE EXCEPTION 'Animal ownership changed; request unavailable' USING ERRCODE='42501'; END IF;
  IF b.service_snapshot->>'delivery_mode'='clinic_visit' THEN
  SELECT address||', '||city||', '||state INTO primary_address FROM public.provider_locations WHERE provider_id=provider_uuid AND is_primary;
  END IF;
 END IF;
 UPDATE public.provider_booking_requests SET status=decision,response_note=note,provider_address=CASE WHEN decision='confirmed' THEN primary_address ELSE provider_address END,version=version+1,updated_at=now() WHERE id=b.id;
 INSERT INTO public.provider_booking_events(booking_id,actor_id,status,note,version) VALUES(b.id,actor,decision,note,b.version+1);
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id,details) VALUES(actor,'provider_booking_status_changed','provider_booking',b.id,jsonb_build_object('status',decision,'version',b.version+1));
 INSERT INTO public.notifications(user_id,title,message,link) VALUES(CASE WHEN b.customer_id=actor THEN b.provider_owner_id ELSE b.customer_id END,'Booking request updated','Booking status: '||decision||'. View the booking for details.',CASE WHEN b.customer_id=actor THEN '/provider/organization/'||(b.service_snapshot->>'provider_slug') ELSE '/my-bookings' END);
 RETURN b.id;
END $$;
REVOKE ALL ON FUNCTION public.save_provider_booking_schedule(uuid,boolean,jsonb,date[],integer),public.get_provider_booking_slots(uuid,date),public.request_provider_booking(uuid,integer,timestamptz,uuid,uuid,uuid,text,text,text),public.respond_provider_booking(uuid,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_booking_slots(uuid,date) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_provider_booking_schedule(uuid,boolean,jsonb,date[],integer),public.request_provider_booking(uuid,integer,timestamptz,uuid,uuid,uuid,text,text,text),public.respond_provider_booking(uuid,integer,text,text) TO authenticated;
-- Append safe booking configuration fields without exposing private weekly schedules or requests.
CREATE OR REPLACE VIEW public.provider_service_catalog WITH (security_barrier=true) AS
 SELECT s.id,s.provider_id,s.name,s.description,s.category,s.delivery_mode,s.duration_minutes,s.base_price,s.currency,s.updated_at,
 o.name AS organization_name,o.slug AS provider_slug,o.provider_type,l.city,l.state,l.country,
 s.version AS service_version,coalesce(config.enabled,false) AS booking_enabled
 FROM public.provider_services s JOIN public.provider_organizations o ON o.id=s.provider_id
 JOIN public.provider_locations l ON l.provider_id=o.id AND l.is_primary AND l.is_active
 LEFT JOIN public.provider_booking_settings config ON config.provider_id=o.id
 WHERE s.is_published AND o.status='active' AND public.provider_publication_eligible(o.id);
COMMIT;
