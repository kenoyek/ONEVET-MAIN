BEGIN;
ALTER TABLE public.provider_members ADD COLUMN version integer NOT NULL DEFAULT 1;
CREATE FUNCTION public.has_provider_team_access(provider_uuid uuid, capability text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS (
  SELECT 1 FROM public.provider_organizations o
  JOIN public.provider_members own ON own.provider_id=o.id AND own.user_id=o.created_by AND own.member_role='owner' AND own.status='active'
  JOIN public.profiles owner_profile ON owner_profile.user_id=o.created_by AND owner_profile.is_active
  JOIN public.provider_members m ON m.provider_id=o.id AND m.user_id=auth.uid() AND m.status='active'
  JOIN public.profiles p ON p.user_id=m.user_id AND p.is_active
  WHERE o.id=provider_uuid AND (
   (capability='workspace' AND m.member_role IN ('owner','manager','staff')) OR
   (capability='services' AND m.member_role IN ('owner','manager')) OR
   (capability='bookings' AND m.member_role IN ('owner','manager','staff')))
 )
$$;
REVOKE ALL ON FUNCTION public.has_provider_team_access(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.has_provider_team_access(uuid,text) TO authenticated;
CREATE POLICY provider_team_workspace_read ON public.provider_organizations FOR SELECT TO authenticated USING (public.has_provider_team_access(id,'workspace'));
CREATE POLICY provider_team_location_read ON public.provider_locations FOR SELECT TO authenticated USING (public.has_provider_team_access(provider_id,'workspace'));
CREATE POLICY provider_team_service_read ON public.provider_services FOR SELECT TO authenticated USING (public.has_provider_team_access(provider_id,'services'));
CREATE POLICY provider_team_settings_read ON public.provider_booking_settings FOR SELECT TO authenticated USING (public.has_provider_team_access(provider_id,'bookings'));
CREATE POLICY provider_team_booking_read ON public.provider_booking_requests FOR SELECT TO authenticated USING (public.has_provider_team_access(provider_id,'bookings'));

CREATE TABLE public.provider_team_invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider_id uuid NOT NULL REFERENCES public.provider_organizations(id),
 invited_email text NOT NULL CHECK (length(invited_email)<=254 AND invited_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 member_role text NOT NULL CHECK (member_role IN ('manager','staff')),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','revoked')),
 invited_by uuid NOT NULL REFERENCES auth.users(id), accepted_by uuid REFERENCES auth.users(id),
 expires_at timestamptz NOT NULL DEFAULT (now()+interval '7 days'), version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX provider_team_pending_email ON public.provider_team_invitations(provider_id,invited_email) WHERE status='pending';
CREATE INDEX provider_team_recipient_idx ON public.provider_team_invitations(invited_email,status);
ALTER TABLE public.provider_team_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.provider_team_invitations FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.provider_team_invitations TO authenticated;
GRANT ALL ON public.provider_team_invitations TO service_role;
CREATE FUNCTION public.is_provider_invitation_recipient(email_address text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM auth.users u JOIN public.profiles p ON p.user_id=u.id AND p.is_active WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL AND lower(btrim(u.email))=email_address)
$$;
REVOKE ALL ON FUNCTION public.is_provider_invitation_recipient(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.is_provider_invitation_recipient(text) TO authenticated;
CREATE POLICY provider_invitation_owner_read ON public.provider_team_invitations FOR SELECT TO authenticated USING(public.owns_provider_workspace(provider_id));
CREATE POLICY provider_invitation_recipient_read ON public.provider_team_invitations FOR SELECT TO authenticated USING(public.is_provider_invitation_recipient(invited_email));

CREATE FUNCTION public.invite_provider_team_member(provider_uuid uuid, email_address text, requested_role text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE org public.provider_organizations; target uuid; recipient uuid; normalized text:=lower(btrim(email_address));
BEGIN
 SELECT * INTO org FROM public.provider_organizations WHERE id=provider_uuid FOR UPDATE;
 IF NOT FOUND OR NOT public.owns_provider_workspace(provider_uuid) OR org.status='suspended' THEN RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501'; END IF;
 IF requested_role IS NULL OR requested_role NOT IN ('manager','staff') OR normalized IS NULL OR length(normalized)>254 OR normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'Choose a supported role and valid email' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid() AND lower(btrim(email))=normalized) THEN RAISE EXCEPTION 'The owner already has access' USING ERRCODE='22023'; END IF;
 UPDATE public.provider_team_invitations SET status='revoked',version=version+1,updated_at=now() WHERE provider_id=provider_uuid AND invited_email=normalized AND status='pending' AND expires_at<=now();
 IF (SELECT count(*) FROM public.provider_team_invitations WHERE provider_id=provider_uuid AND status='pending' AND expires_at>now())>=50 THEN RAISE EXCEPTION 'Pending invitation limit reached' USING ERRCODE='23514'; END IF;
 INSERT INTO public.provider_team_invitations(provider_id,invited_email,member_role,invited_by) VALUES(provider_uuid,normalized,requested_role,auth.uid()) RETURNING id INTO target;
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id,details) VALUES(auth.uid(),'provider_team_invited','provider_organization',provider_uuid,jsonb_build_object('invitation_id',target,'role',requested_role));
 -- Return the same result shape whether or not the recipient already has an account.
 SELECT u.id INTO recipient FROM auth.users u JOIN public.profiles p ON p.user_id=u.id AND p.is_active WHERE lower(btrim(u.email))=normalized AND u.email_confirmed_at IS NOT NULL LIMIT 1;
 IF recipient IS NOT NULL THEN INSERT INTO public.notifications(user_id,title,message,link) VALUES(recipient,'Organization invitation','You have a new organization team invitation. Review the role and access before accepting.','/provider/invitations'); END IF;
 RETURN target;
END $$;
CREATE FUNCTION public.respond_provider_team_invitation(invitation_uuid uuid, expected_version integer, decision text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE invite public.provider_team_invitations; member public.provider_members; org public.provider_organizations; provider_uuid uuid;
BEGIN
 SELECT provider_id INTO provider_uuid FROM public.provider_team_invitations WHERE id=invitation_uuid;
 SELECT * INTO org FROM public.provider_organizations WHERE id=provider_uuid FOR UPDATE;
 SELECT * INTO invite FROM public.provider_team_invitations WHERE id=invitation_uuid FOR UPDATE;
 IF NOT FOUND OR NOT public.is_provider_invitation_recipient(invite.invited_email) THEN RAISE EXCEPTION 'Verified recipient access required' USING ERRCODE='42501'; END IF;
 IF invite.status='accepted' AND invite.accepted_by=auth.uid() AND decision='accept' THEN
  SELECT * INTO member FROM public.provider_members WHERE provider_id=provider_uuid AND user_id=auth.uid();
  IF FOUND AND member.status='active' THEN RETURN provider_uuid; END IF;
  RAISE EXCEPTION 'Membership has been revoked; contact the owner' USING ERRCODE='42501';
 END IF;
 IF invite.version IS DISTINCT FROM expected_version THEN RAISE EXCEPTION 'Invitation changed; refresh' USING ERRCODE='40001'; END IF;
 IF invite.status<>'pending' OR invite.expires_at<=now() OR org.status='suspended' OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=org.created_by AND is_active) OR NOT EXISTS (SELECT 1 FROM public.provider_members WHERE provider_id=org.id AND user_id=org.created_by AND member_role='owner' AND status='active') THEN RAISE EXCEPTION 'Invitation unavailable' USING ERRCODE='42501'; END IF;
 IF decision IS NULL OR decision NOT IN ('accept','decline') THEN RAISE EXCEPTION 'Choose accept or decline' USING ERRCODE='22023'; END IF;
 IF decision='accept' THEN
  SELECT * INTO member FROM public.provider_members WHERE provider_id=provider_uuid AND user_id=auth.uid() FOR UPDATE;
  IF FOUND AND member.member_role='owner' THEN RAISE EXCEPTION 'Ownership cannot be changed by invitation' USING ERRCODE='42501'; END IF;
  IF (member.id IS NULL OR member.status<>'active') AND (SELECT count(*) FROM public.provider_members WHERE provider_id=provider_uuid AND status='active')>=50 THEN RAISE EXCEPTION 'Team size limit reached' USING ERRCODE='23514'; END IF;
  INSERT INTO public.provider_members(provider_id,user_id,member_role,permissions,status,invited_by)
  VALUES(provider_uuid,auth.uid(),invite.member_role,CASE WHEN invite.member_role='manager' THEN '["services","bookings"]'::jsonb ELSE '["bookings"]'::jsonb END,'active',invite.invited_by)
  ON CONFLICT(provider_id,user_id) DO UPDATE SET member_role=EXCLUDED.member_role,permissions=EXCLUDED.permissions,status='active',invited_by=EXCLUDED.invited_by,version=provider_members.version+1,updated_at=now();
 END IF;
 UPDATE public.provider_team_invitations SET status=CASE WHEN decision='accept' THEN 'accepted' ELSE 'declined' END,accepted_by=auth.uid(),version=version+1,updated_at=now() WHERE id=invite.id;
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id,details) VALUES(auth.uid(),CASE WHEN decision='accept' THEN 'provider_team_invitation_accepted' ELSE 'provider_team_invitation_declined' END,'provider_organization',provider_uuid,jsonb_build_object('invitation_id',invite.id));
 INSERT INTO public.notifications(user_id,title,message,link) VALUES(org.created_by,'Team invitation updated','An organization invitation was '||CASE WHEN decision='accept' THEN 'accepted.' ELSE 'declined.' END,'/provider/organization/'||org.slug);
 RETURN provider_uuid;
END $$;
CREATE FUNCTION public.revoke_provider_team_invitation(invitation_uuid uuid, expected_version integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE invite public.provider_team_invitations; provider_uuid uuid;
BEGIN
 SELECT provider_id INTO provider_uuid FROM public.provider_team_invitations WHERE id=invitation_uuid;
 PERFORM 1 FROM public.provider_organizations WHERE id=provider_uuid FOR UPDATE;
 IF NOT public.owns_provider_workspace(provider_uuid) THEN RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501'; END IF;
 SELECT * INTO invite FROM public.provider_team_invitations WHERE id=invitation_uuid FOR UPDATE;
 IF NOT FOUND OR invite.version IS DISTINCT FROM expected_version OR invite.status<>'pending' THEN RAISE EXCEPTION 'Invitation changed; refresh' USING ERRCODE='40001'; END IF;
 UPDATE public.provider_team_invitations SET status='revoked',version=version+1,updated_at=now() WHERE id=invitation_uuid;
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id,details) VALUES(auth.uid(),'provider_team_invitation_revoked','provider_organization',provider_uuid,jsonb_build_object('invitation_id',invitation_uuid));
END $$;
CREATE FUNCTION public.update_provider_team_member(member_uuid uuid, expected_version integer, requested_role text, active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE member public.provider_members; org public.provider_organizations; provider_uuid uuid;
BEGIN
 SELECT provider_id INTO provider_uuid FROM public.provider_members WHERE id=member_uuid;
 SELECT * INTO org FROM public.provider_organizations WHERE id=provider_uuid FOR UPDATE;
 IF NOT public.owns_provider_workspace(provider_uuid) THEN RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501'; END IF;
 SELECT * INTO member FROM public.provider_members WHERE id=member_uuid FOR UPDATE;
 IF NOT FOUND OR member.member_role='owner' OR member.user_id=auth.uid() THEN RAISE EXCEPTION 'Ownership cannot be changed here' USING ERRCODE='42501'; END IF;
 IF member.version IS DISTINCT FROM expected_version THEN RAISE EXCEPTION 'Membership changed; refresh' USING ERRCODE='40001'; END IF;
 IF requested_role IS NULL OR requested_role NOT IN ('manager','staff') OR active IS NULL THEN RAISE EXCEPTION 'Unsupported team role' USING ERRCODE='22023'; END IF;
 IF active AND (org.status='suspended' OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=member.user_id AND is_active)) THEN RAISE EXCEPTION 'Account or organization unavailable' USING ERRCODE='42501'; END IF;
 IF active AND member.status<>'active' AND (SELECT count(*) FROM public.provider_members WHERE provider_id=provider_uuid AND status='active')>=50 THEN RAISE EXCEPTION 'Team size limit reached' USING ERRCODE='23514'; END IF;
 UPDATE public.provider_members SET member_role=requested_role,status=CASE WHEN active THEN 'active' ELSE 'suspended' END,permissions=CASE WHEN requested_role='manager' THEN '["services","bookings"]'::jsonb ELSE '["bookings"]'::jsonb END,version=version+1,updated_at=now() WHERE id=member_uuid;
 UPDATE public.provider_team_invitations SET status='revoked',version=version+1,updated_at=now() WHERE provider_id=provider_uuid AND status='pending' AND invited_email=(SELECT lower(btrim(email)) FROM auth.users WHERE id=member.user_id);
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id,details) VALUES(auth.uid(),'provider_team_member_updated','provider_organization',provider_uuid,jsonb_build_object('member_id',member_uuid,'role',requested_role,'active',active));
 INSERT INTO public.notifications(user_id,title,message,link) VALUES(member.user_id,'Organization access updated','An organization owner changed your team access. Review your current workspaces.','/provider/invitations');
END $$;
CREATE FUNCTION public.list_provider_team(provider_uuid uuid)
RETURNS TABLE(id uuid,user_id uuid,display_name text,invitation_email text,member_role text,status text,version integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.owns_provider_workspace(provider_uuid) THEN RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT m.id,m.user_id,btrim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,'')),(SELECT i.invited_email FROM public.provider_team_invitations i WHERE i.provider_id=m.provider_id AND i.accepted_by=m.user_id AND i.status='accepted' ORDER BY i.updated_at DESC,i.id LIMIT 1),m.member_role,m.status,m.version FROM public.provider_members m JOIN public.profiles p ON p.user_id=m.user_id WHERE m.provider_id=provider_uuid ORDER BY (m.status='active') DESC,m.created_at DESC,m.id LIMIT 100;
END $$;
CREATE FUNCTION public.list_provider_workspaces()
RETURNS TABLE(id uuid,name text,slug text,member_role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT o.id,o.name,o.slug,m.member_role FROM public.provider_organizations o JOIN public.provider_members m ON m.provider_id=o.id AND m.user_id=auth.uid() WHERE public.has_provider_team_access(o.id,'workspace') ORDER BY o.name,o.id
$$;
CREATE FUNCTION public.list_provider_team_invitations()
RETURNS TABLE(id uuid,provider_id uuid,organization_name text,provider_slug text,member_role text,expires_at timestamptz,version integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT i.id,o.id,o.name,o.slug,i.member_role,i.expires_at,i.version FROM public.provider_team_invitations i JOIN public.provider_organizations o ON o.id=i.provider_id WHERE i.status='pending' AND i.expires_at>now() AND public.is_provider_invitation_recipient(i.invited_email) ORDER BY i.created_at DESC,i.id
$$;
REVOKE ALL ON FUNCTION public.invite_provider_team_member(uuid,text,text),public.respond_provider_team_invitation(uuid,integer,text),public.revoke_provider_team_invitation(uuid,integer),public.update_provider_team_member(uuid,integer,text,boolean),public.list_provider_team(uuid),public.list_provider_workspaces(),public.list_provider_team_invitations() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.invite_provider_team_member(uuid,text,text),public.respond_provider_team_invitation(uuid,integer,text),public.revoke_provider_team_invitation(uuid,integer),public.update_provider_team_member(uuid,integer,text,boolean),public.list_provider_team(uuid),public.list_provider_workspaces(),public.list_provider_team_invitations() TO authenticated;
CREATE OR REPLACE FUNCTION public.save_provider_service(provider_uuid uuid, input jsonb, service_uuid uuid DEFAULT NULL, expected_version integer DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE org public.provider_organizations; target uuid; existing public.provider_services; category_value text;
BEGIN
 SELECT * INTO org FROM public.provider_organizations WHERE id=provider_uuid FOR UPDATE;
 IF NOT FOUND OR NOT public.has_provider_team_access(provider_uuid,'services') OR org.status='suspended' THEN RAISE EXCEPTION 'Service editing is unavailable' USING ERRCODE='42501'; END IF;
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
CREATE OR REPLACE FUNCTION public.set_provider_service_publication(service_uuid uuid, publish boolean, expected_version integer)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE provider_uuid uuid; existing public.provider_services;
BEGIN
 SELECT provider_id INTO provider_uuid FROM public.provider_services WHERE id=service_uuid;
 PERFORM 1 FROM public.provider_organizations WHERE id=provider_uuid FOR UPDATE;
 IF NOT FOUND OR NOT public.has_provider_team_access(provider_uuid,'services') THEN RAISE EXCEPTION 'Service publication is unavailable' USING ERRCODE='42501'; END IF;
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
CREATE OR REPLACE FUNCTION public.save_provider_booking_schedule(provider_uuid uuid, enabled boolean, weekly jsonb, closed_dates date[], expected_version integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE day jsonb; actual_version integer; d integer; opens integer; closes integer;
BEGIN
 PERFORM 1 FROM public.provider_organizations WHERE id=provider_uuid AND status<>'suspended' FOR UPDATE;
 IF NOT FOUND OR NOT public.has_provider_team_access(provider_uuid,'bookings') THEN RAISE EXCEPTION 'Schedule editing unavailable' USING ERRCODE='42501'; END IF;
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

CREATE OR REPLACE FUNCTION public.get_booking_reschedule_slots(booking_uuid uuid, local_date date)
RETURNS TABLE(start_at timestamptz,end_at timestamptz) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE booking public.provider_booking_requests;
BEGIN
 SELECT * INTO booking FROM public.provider_booking_requests WHERE id=booking_uuid;
 IF NOT FOUND OR NOT (booking.customer_id=auth.uid() OR public.has_provider_team_access(booking.provider_id,'bookings')) OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND is_active) THEN RAISE EXCEPTION 'Appointment unavailable' USING ERRCODE='42501'; END IF;
 IF booking.status<>'confirmed' OR booking.start_at<=now() THEN RETURN; END IF;
 RETURN QUERY SELECT * FROM public.internal_provider_booking_slots(booking.service_id,local_date,booking.id);
END $$;
CREATE OR REPLACE FUNCTION public.respond_provider_booking(booking_uuid uuid, expected_version integer, decision text, response_note text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE original public.provider_booking_requests; child public.provider_booking_requests; b public.provider_booking_requests; provider_uuid uuid; actor uuid:=auth.uid(); owner boolean; note text:=btrim(coalesce(response_note,'')); primary_address text;
BEGIN
 SELECT provider_id INTO provider_uuid FROM public.provider_booking_requests WHERE id=booking_uuid;
 PERFORM 1 FROM public.provider_organizations WHERE id=provider_uuid FOR UPDATE;
 SELECT * INTO b FROM public.provider_booking_requests WHERE id=booking_uuid FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=actor AND is_active) THEN RAISE EXCEPTION 'Booking unavailable' USING ERRCODE='42501'; END IF;
 owner:=public.has_provider_team_access(provider_uuid,'bookings');
 IF NOT (owner OR b.customer_id=actor OR public.is_provider_reviewer()) THEN RAISE EXCEPTION 'Booking unavailable' USING ERRCODE='42501'; END IF;
 IF b.version IS DISTINCT FROM expected_version THEN RAISE EXCEPTION 'Booking changed; refresh' USING ERRCODE='40001'; END IF;
 IF length(note)>2000 OR (decision IN ('declined','cancelled') AND length(note)<5) THEN RAISE EXCEPTION 'Explain the decision (5–2000 characters)' USING ERRCODE='22023'; END IF;
 IF decision IS NULL OR NOT ((decision='cancelled' AND b.status IN ('pending','confirmed')) OR (owner AND decision IN ('confirmed','declined') AND b.status='pending') OR (owner AND decision='completed' AND b.status='confirmed' AND b.end_at<=now())) THEN RAISE EXCEPTION 'Invalid booking transition' USING ERRCODE='42501'; END IF;
 IF b.customer_id=actor AND decision IN ('confirmed','declined','completed') THEN RAISE EXCEPTION 'Independent provider response required' USING ERRCODE='42501'; END IF;
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
  INSERT INTO public.provider_booking_events(booking_id,actor_id,status,note,version,event_kind) VALUES(original.id,actor,'cancelled','Replaced by a confirmed reschedule request.',original.version+1,'original_replaced');
  INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id,details) VALUES(actor,'provider_booking_rescheduled','provider_booking',original.id,jsonb_build_object('replacement_id',b.id));
 END IF;
 UPDATE public.provider_booking_requests SET status=decision,response_note=note,provider_address=CASE WHEN decision='confirmed' THEN primary_address ELSE provider_address END,version=version+1,updated_at=now() WHERE id=b.id;
 INSERT INTO public.provider_booking_events(booking_id,actor_id,status,note,version) VALUES(b.id,actor,decision,note,b.version+1);
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id,details) VALUES(actor,'provider_booking_status_changed','provider_booking',b.id,jsonb_build_object('status',decision,'version',b.version+1));
 IF decision IN ('cancelled','completed','declined') THEN
  FOR child IN SELECT * FROM public.provider_booking_requests WHERE replacement_for=b.id AND status='pending' FOR UPDATE LOOP
   UPDATE public.provider_booking_requests SET status='cancelled',response_note='Original appointment is no longer available for rescheduling.',version=version+1,updated_at=now() WHERE id=child.id;
   INSERT INTO public.provider_booking_events(booking_id,actor_id,status,note,version,event_kind) VALUES(child.id,actor,'cancelled','Original appointment is no longer available for rescheduling.',child.version+1,'original_closed');
   INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id) VALUES(actor,'provider_booking_reschedule_closed','provider_booking',child.id);
  END LOOP;
 END IF;
 RETURN b.id;
END $$;


CREATE OR REPLACE FUNCTION public.notify_provider_booking_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE booking public.provider_booking_requests; recipient uuid; heading text; body text; when_text text;
BEGIN
 SELECT * INTO booking FROM public.provider_booking_requests WHERE id=NEW.booking_id;
 IF NOT FOUND OR booking.version<>NEW.version OR booking.status<>NEW.status THEN RAISE EXCEPTION 'Booking alert must match the current event' USING ERRCODE='23514'; END IF;
 -- The replacement confirmation or original status event already explains these linked changes.
 IF NEW.event_kind<>'status_changed' THEN RETURN NEW; END IF;
 when_text:=to_char(booking.start_at AT TIME ZONE 'Africa/Lagos','DD Mon YYYY HH24:MI')||' WAT';
 heading:=CASE NEW.status
  WHEN 'pending' THEN CASE WHEN booking.replacement_for IS NULL THEN 'New booking request' ELSE 'Reschedule requested' END
  WHEN 'confirmed' THEN CASE WHEN booking.replacement_for IS NULL THEN 'Booking confirmed' ELSE 'Reschedule confirmed' END
  WHEN 'declined' THEN CASE WHEN booking.replacement_for IS NULL THEN 'Booking request declined' ELSE 'Reschedule request declined' END
  WHEN 'cancelled' THEN CASE WHEN booking.replacement_for IS NULL THEN 'Booking cancelled' ELSE 'Reschedule request cancelled' END
  WHEN 'completed' THEN 'Appointment completed'
 END;
 IF heading IS NULL THEN RAISE EXCEPTION 'Unsupported booking alert status'; END IF;
 body:=CASE WHEN NEW.status='pending' AND booking.replacement_for IS NOT NULL THEN 'A different time was requested for '||when_text||'. The original appointment stays confirmed until you accept the replacement.'
  WHEN NEW.status='confirmed' AND booking.replacement_for IS NOT NULL THEN 'The replacement appointment for '||when_text||' is confirmed. It replaces the original booking.'
  WHEN booking.replacement_for IS NOT NULL AND NEW.status IN ('declined','cancelled') THEN 'The alternative for '||when_text||' was '||NEW.status||'. Review the original appointment for its current status.'
  ELSE 'Appointment for '||when_text||': '||NEW.status||'. Open the request for current details.' END;
 FOREACH recipient IN ARRAY ARRAY(
  SELECT DISTINCT recipients.user_id FROM (
   SELECT booking.provider_owner_id AS user_id
   UNION ALL SELECT booking.customer_id WHERE NEW.status<>'pending'
   UNION ALL SELECT m.user_id FROM public.provider_members m JOIN public.profiles p ON p.user_id=m.user_id AND p.is_active WHERE m.provider_id=booking.provider_id AND m.status='active' AND m.member_role IN ('manager','staff') AND EXISTS(SELECT 1 FROM public.profiles owner_profile WHERE owner_profile.user_id=booking.provider_owner_id AND owner_profile.is_active) AND EXISTS(SELECT 1 FROM public.provider_members owner_member WHERE owner_member.provider_id=booking.provider_id AND owner_member.user_id=booking.provider_owner_id AND owner_member.member_role='owner' AND owner_member.status='active')
  ) recipients
 ) LOOP
  IF recipient IS DISTINCT FROM NEW.actor_id THEN
   INSERT INTO public.notifications(user_id,title,message,type,link,booking_id,booking_version)
   VALUES(recipient,heading,body,CASE WHEN NEW.status IN ('declined','cancelled') THEN 'warning' WHEN NEW.status IN ('confirmed','completed') THEN 'success' ELSE 'info' END,'/appointments/'||booking.id,booking.id,NEW.version)
   ON CONFLICT(user_id,booking_id,booking_version) WHERE booking_id IS NOT NULL DO NOTHING;
  END IF;
 END LOOP;
 RETURN NEW;
END $$;

COMMIT;
