BEGIN;
ALTER TABLE public.provider_booking_requests
 ADD COLUMN replacement_for uuid REFERENCES public.provider_booking_requests(id),
 ADD COLUMN replacement_version integer,
 ADD COLUMN reschedule_reason text NOT NULL DEFAULT '',
 ADD CONSTRAINT booking_replacement_fields CHECK (
  (replacement_for IS NULL AND replacement_version IS NULL AND reschedule_reason='') OR
  (replacement_for IS NOT NULL AND replacement_for<>id AND replacement_version IS NOT NULL AND length(reschedule_reason) BETWEEN 5 AND 1000)
 );
CREATE UNIQUE INDEX one_pending_booking_replacement ON public.provider_booking_requests(replacement_for) WHERE replacement_for IS NOT NULL AND status='pending';
CREATE FUNCTION public.internal_provider_booking_slots(service_uuid uuid, local_date date, excluded_booking uuid)
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
  SELECT 1 FROM public.provider_booking_requests b WHERE b.provider_owner_id=candidates.created_by AND b.status='confirmed' AND (excluded_booking IS NULL OR b.id<>excluded_booking)
  AND tstzrange(b.start_at,b.end_at,'[)') && tstzrange(starts,starts+make_interval(mins=>duration_minutes),'[)')
 ) ORDER BY starts
$$;


REVOKE ALL ON FUNCTION public.internal_provider_booking_slots(uuid,date,uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.get_provider_booking_slots(service_uuid uuid, local_date date)
RETURNS TABLE(start_at timestamptz,end_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT * FROM public.internal_provider_booking_slots(service_uuid,local_date,NULL)
$$;
CREATE FUNCTION public.get_booking_reschedule_slots(booking_uuid uuid, local_date date)
RETURNS TABLE(start_at timestamptz,end_at timestamptz) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE booking public.provider_booking_requests;
BEGIN
 SELECT * INTO booking FROM public.provider_booking_requests WHERE id=booking_uuid;
 IF NOT FOUND OR NOT (booking.customer_id=auth.uid() OR public.owns_provider_workspace(booking.provider_id)) OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND is_active) THEN RAISE EXCEPTION 'Appointment unavailable' USING ERRCODE='42501'; END IF;
 IF booking.status<>'confirmed' OR booking.start_at<=now() THEN RETURN; END IF;
 RETURN QUERY SELECT * FROM public.internal_provider_booking_slots(booking.service_id,local_date,booking.id);
END $$;
REVOKE ALL ON FUNCTION public.get_booking_reschedule_slots(uuid,date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_reschedule_slots(uuid,date) TO authenticated;
CREATE FUNCTION public.internal_create_provider_booking(service_uuid uuid, expected_service_version integer, start_time timestamptz, request_key uuid,
 animal_pet uuid DEFAULT NULL, animal_batch uuid DEFAULT NULL, contact_phone text DEFAULT '', visit_address text DEFAULT '', customer_notes text DEFAULT '', original_booking uuid DEFAULT NULL, original_version integer DEFAULT NULL, reason text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE original public.provider_booking_requests; actor uuid:=auth.uid(); org public.provider_organizations; svc public.provider_services; existing public.provider_booking_requests; target uuid; animal jsonb; finish timestamptz; phone text:=btrim(contact_phone); address text:=btrim(visit_address); notes text:=btrim(customer_notes);
BEGIN
 PERFORM 1 FROM public.profiles WHERE user_id=actor AND is_active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active customer account required' USING ERRCODE='42501'; END IF;
 SELECT * INTO existing FROM public.provider_booking_requests b WHERE b.customer_id=actor AND b.request_key=internal_create_provider_booking.request_key;
 IF FOUND THEN
  IF existing.service_id=service_uuid AND existing.start_at=start_time AND existing.pet_id IS NOT DISTINCT FROM animal_pet AND existing.batch_id IS NOT DISTINCT FROM animal_batch AND existing.contact_phone=phone AND existing.visit_address=address AND existing.customer_notes=notes AND existing.replacement_for IS NOT DISTINCT FROM original_booking AND existing.reschedule_reason=btrim(reason) THEN RETURN existing.id; END IF;
  RAISE EXCEPTION 'Request key already used for different details' USING ERRCODE='22023';
 END IF;
 SELECT * INTO svc FROM public.provider_services WHERE id=service_uuid;
 SELECT * INTO org FROM public.provider_organizations WHERE id=svc.provider_id FOR UPDATE;
 -- Re-read after the organization lock so a concurrent price/publication change cannot be missed.
 SELECT * INTO svc FROM public.provider_services WHERE id=service_uuid;
 IF org.id IS NULL OR org.created_by=actor OR NOT EXISTS(SELECT 1 FROM public.provider_service_catalog WHERE id=service_uuid) THEN RAISE EXCEPTION 'Service unavailable' USING ERRCODE='42501'; END IF;
 IF original_booking IS NOT NULL THEN
  SELECT * INTO original FROM public.provider_booking_requests WHERE id=original_booking FOR UPDATE;
  IF NOT FOUND OR original.customer_id<>actor OR original.service_id<>service_uuid OR original.status<>'confirmed' OR original.start_at<=now() THEN RAISE EXCEPTION 'Original appointment unavailable for rescheduling' USING ERRCODE='42501'; END IF;
  IF original.version IS DISTINCT FROM original_version THEN RAISE EXCEPTION 'Original appointment changed; refresh' USING ERRCODE='40001'; END IF;
  IF start_time=original.start_at OR length(btrim(coalesce(reason,''))) NOT BETWEEN 5 AND 1000 THEN RAISE EXCEPTION 'Choose a different time and explain the change (5–1000 characters)' USING ERRCODE='22023'; END IF;
 END IF;
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
 SELECT end_at INTO finish FROM public.internal_provider_booking_slots(service_uuid,(start_time AT TIME ZONE 'Africa/Lagos')::date,original_booking) WHERE start_at=start_time;
 IF finish IS NULL THEN RAISE EXCEPTION 'Slot unavailable; refresh times' USING ERRCODE='23P01'; END IF;
 IF (SELECT count(*) FROM public.provider_booking_requests WHERE customer_id=actor AND status='pending' AND start_at>now())>=20 OR (SELECT count(*) FROM public.provider_booking_requests WHERE customer_id=actor AND provider_id=org.id AND status='pending' AND start_at>now())>=5 THEN RAISE EXCEPTION 'Pending request limit reached; manage existing requests' USING ERRCODE='23514'; END IF;
 INSERT INTO public.provider_booking_requests(provider_id,provider_owner_id,service_id,customer_id,request_key,pet_id,batch_id,animal_snapshot,service_snapshot,start_at,end_at,base_fee,contact_phone,visit_address,customer_notes,replacement_for,replacement_version,reschedule_reason)
 VALUES(org.id,org.created_by,svc.id,actor,request_key,animal_pet,animal_batch,animal,jsonb_build_object('name',svc.name,'category',svc.category,'delivery_mode',svc.delivery_mode,'duration_minutes',svc.duration_minutes,'organization_name',org.name,'provider_slug',org.slug,'city',org.city,'state',org.state,'service_version',svc.version),start_time,finish,svc.base_price,phone,address,notes,original_booking,original_version,btrim(reason)) RETURNING id INTO target;
 INSERT INTO public.provider_booking_events(booking_id,actor_id,status,version) VALUES(target,actor,'pending',1);
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id) VALUES(actor,CASE WHEN original_booking IS NULL THEN 'provider_booking_requested' ELSE 'provider_booking_reschedule_requested' END,'provider_booking',target);
 INSERT INTO public.notifications(user_id,title,message,link) VALUES(org.created_by,'New booking request','A customer requested a service. Review it in your organization workspace.','/provider/organization/'||org.slug);
 RETURN target;
END $$;


REVOKE ALL ON FUNCTION public.internal_create_provider_booking(uuid,integer,timestamptz,uuid,uuid,uuid,text,text,text,uuid,integer,text) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.request_provider_booking(service_uuid uuid, expected_service_version integer, start_time timestamptz, request_key uuid,
 animal_pet uuid DEFAULT NULL, animal_batch uuid DEFAULT NULL, contact_phone text DEFAULT '', visit_address text DEFAULT '', customer_notes text DEFAULT '')
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.internal_create_provider_booking(service_uuid,expected_service_version,start_time,request_key,animal_pet,animal_batch,contact_phone,visit_address,customer_notes,NULL,NULL,'')
$$;
CREATE FUNCTION public.request_booking_reschedule(booking_uuid uuid, expected_booking_version integer, expected_service_version integer, start_time timestamptz, request_key uuid, reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE booking public.provider_booking_requests;
BEGIN
 SELECT * INTO booking FROM public.provider_booking_requests WHERE id=booking_uuid AND customer_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Appointment unavailable' USING ERRCODE='42501'; END IF;
 RETURN public.internal_create_provider_booking(booking.service_id,expected_service_version,start_time,request_key,booking.pet_id,booking.batch_id,booking.contact_phone,booking.visit_address,booking.customer_notes,booking.id,expected_booking_version,reason);
END $$;
REVOKE ALL ON FUNCTION public.request_booking_reschedule(uuid,integer,integer,timestamptz,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.request_booking_reschedule(uuid,integer,integer,timestamptz,uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.respond_provider_booking(booking_uuid uuid, expected_version integer, decision text, response_note text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE original public.provider_booking_requests; child public.provider_booking_requests; b public.provider_booking_requests; provider_uuid uuid; actor uuid:=auth.uid(); owner boolean; note text:=btrim(coalesce(response_note,'')); primary_address text;
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
  IF b.replacement_for IS NOT NULL THEN
   SELECT * INTO original FROM public.provider_booking_requests WHERE id=b.replacement_for FOR UPDATE;
   IF NOT FOUND OR original.status<>'confirmed' OR original.start_at<=now() OR original.version IS DISTINCT FROM b.replacement_version THEN RAISE EXCEPTION 'Original appointment changed; request a new reschedule' USING ERRCODE='40001'; END IF;
  END IF;
  IF NOT public.provider_publication_eligible(provider_uuid) OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=b.customer_id AND is_active) OR NOT EXISTS (SELECT 1 FROM public.internal_provider_booking_slots(b.service_id,(b.start_at AT TIME ZONE 'Africa/Lagos')::date,b.replacement_for) WHERE start_at=b.start_at AND end_at=b.end_at) THEN RAISE EXCEPTION 'Slot or service unavailable; refresh' USING ERRCODE='23P01'; END IF;
  IF (SELECT (service_snapshot->>'service_version')::integer FROM public.provider_booking_requests WHERE id=b.id) IS DISTINCT FROM (SELECT version FROM public.provider_services WHERE id=b.service_id) THEN RAISE EXCEPTION 'Service changed; customer must submit a new request' USING ERRCODE='40001'; END IF;
  IF NOT ((b.pet_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.pets WHERE id=b.pet_id AND owner_id=public.get_profile_id(b.customer_id))) OR (b.batch_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.livestock_batches batches JOIN public.livestock_farms farms ON farms.id=batches.farm_id WHERE batches.id=b.batch_id AND farms.owner_id=public.get_profile_id(b.customer_id) AND batches.status IN ('active','quarantined')))) THEN RAISE EXCEPTION 'Animal ownership changed; request unavailable' USING ERRCODE='42501'; END IF;
  IF b.service_snapshot->>'delivery_mode'='clinic_visit' THEN
  SELECT address||', '||city||', '||state INTO primary_address FROM public.provider_locations WHERE provider_id=provider_uuid AND is_primary;
  END IF;
 END IF;
 IF decision='confirmed' AND b.replacement_for IS NOT NULL THEN
  UPDATE public.provider_booking_requests SET status='cancelled',response_note='Replaced by a confirmed reschedule request.',version=version+1,updated_at=now() WHERE id=original.id;
  INSERT INTO public.provider_booking_events(booking_id,actor_id,status,note,version) VALUES(original.id,actor,'cancelled','Replaced by a confirmed reschedule request.',original.version+1);
  INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id,details) VALUES(actor,'provider_booking_rescheduled','provider_booking',original.id,jsonb_build_object('replacement_id',b.id));
 END IF;
 UPDATE public.provider_booking_requests SET status=decision,response_note=note,provider_address=CASE WHEN decision='confirmed' THEN primary_address ELSE provider_address END,version=version+1,updated_at=now() WHERE id=b.id;
 INSERT INTO public.provider_booking_events(booking_id,actor_id,status,note,version) VALUES(b.id,actor,decision,note,b.version+1);
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id,details) VALUES(actor,'provider_booking_status_changed','provider_booking',b.id,jsonb_build_object('status',decision,'version',b.version+1));
 INSERT INTO public.notifications(user_id,title,message,link) VALUES(CASE WHEN b.customer_id=actor THEN b.provider_owner_id ELSE b.customer_id END,'Booking request updated',CASE WHEN decision='confirmed' AND b.replacement_for IS NOT NULL THEN 'Reschedule confirmed. This appointment replaces the original booking.' ELSE 'Booking status: '||decision||'. View the booking for details.' END,CASE WHEN b.customer_id=actor THEN '/provider/organization/'||(b.service_snapshot->>'provider_slug') ELSE '/my-bookings' END);
 IF decision IN ('cancelled','completed','declined') THEN
  FOR child IN SELECT * FROM public.provider_booking_requests WHERE replacement_for=b.id AND status='pending' FOR UPDATE LOOP
   UPDATE public.provider_booking_requests SET status='cancelled',response_note='Original appointment is no longer available for rescheduling.',version=version+1,updated_at=now() WHERE id=child.id;
   INSERT INTO public.provider_booking_events(booking_id,actor_id,status,note,version) VALUES(child.id,actor,'cancelled','Original appointment is no longer available for rescheduling.',child.version+1);
   INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id) VALUES(actor,'provider_booking_reschedule_closed','provider_booking',child.id);
  END LOOP;
 END IF;
 RETURN b.id;
END $$;

COMMIT;
