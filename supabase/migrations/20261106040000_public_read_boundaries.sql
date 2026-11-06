-- Follow-up: public read views must never be an alternate profile write path.
BEGIN;
SET LOCAL lock_timeout='5s';
REVOKE ALL ON public.public_profiles,public.care_service_directory FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.public_profiles,public.care_service_directory TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_veterinarian(uuid) TO anon;
DROP POLICY "Participants and Admins can view consultations" ON public.consultations;
CREATE POLICY "Authorized participants read consultations" ON public.consultations FOR SELECT TO authenticated USING(
 pet_owner_id=public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(),'admin') OR
 (veterinarian_id=public.get_profile_id(auth.uid()) AND public.is_verified_veterinarian(auth.uid())));
CREATE OR REPLACE FUNCTION public.is_consultation_participant(_consultation_id uuid,_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT _user_id=auth.uid() AND EXISTS(SELECT 1 FROM consultations c WHERE c.id=_consultation_id AND
 (c.pet_owner_id=public.get_profile_id(_user_id) OR
 (c.veterinarian_id=public.get_profile_id(_user_id) AND public.is_verified_veterinarian(_user_id))));
$$;
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(_user_id uuid)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF _user_id IS DISTINCT FROM auth.uid() AND NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Account access required' USING ERRCODE='42501'; END IF;
 RETURN (SELECT count(*)::integer FROM notifications WHERE user_id=_user_id AND NOT is_read);
END; $$;
CREATE OR REPLACE FUNCTION public.protect_consultation_write() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF current_user IN ('postgres','service_role','supabase_admin') OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.pet_owner_id<>public.get_profile_id(auth.uid()) OR NEW.veterinarian_id IS NOT NULL OR NEW.status<>'pending'
   OR NEW.diagnosis IS NOT NULL OR NEW.prescription IS NOT NULL OR NEW.notes IS NOT NULL OR NEW.started_at IS NOT NULL OR NEW.completed_at IS NOT NULL
   THEN RAISE EXCEPTION 'Invalid consultation request' USING ERRCODE='42501'; END IF;
  IF NOT public.has_active_subscription(auth.uid()) THEN RAISE EXCEPTION 'An active membership is required' USING ERRCODE='42501'; END IF;
 ELSE
  IF ROW(NEW.pet_owner_id,NEW.pet_id) IS DISTINCT FROM ROW(OLD.pet_owner_id,OLD.pet_id) THEN
   RAISE EXCEPTION 'Consultation ownership cannot be changed' USING ERRCODE='42501'; END IF;
  IF OLD.veterinarian_id=public.get_profile_id(auth.uid()) AND public.is_verified_veterinarian(auth.uid()) THEN
   IF NEW.veterinarian_id IS DISTINCT FROM OLD.veterinarian_id OR NEW.chief_complaint IS DISTINCT FROM OLD.chief_complaint
    OR NEW.status NOT IN ('accepted','in_progress','completed','cancelled') THEN RAISE EXCEPTION 'Invalid clinical transition' USING ERRCODE='42501'; END IF;
  ELSE
   IF OLD.pet_owner_id<>public.get_profile_id(auth.uid()) THEN RAISE EXCEPTION 'Clinical access is no longer authorized' USING ERRCODE='42501'; END IF;
   IF ROW(NEW.veterinarian_id,NEW.notes,NEW.diagnosis,NEW.prescription,NEW.started_at,NEW.completed_at)
    IS DISTINCT FROM ROW(OLD.veterinarian_id,OLD.notes,OLD.diagnosis,OLD.prescription,OLD.started_at,OLD.completed_at)
    OR NOT (NEW.status=OLD.status OR (NEW.status='cancelled' AND OLD.status IN ('pending','accepted')))
    THEN RAISE EXCEPTION 'Clinical actions require the assigned approved veterinarian' USING ERRCODE='42501'; END IF;
  END IF;
 END IF;
 IF NEW.pet_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.pets WHERE id=NEW.pet_id AND owner_id=NEW.pet_owner_id) THEN
   RAISE EXCEPTION 'Animal profile does not belong to this customer' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END; $$;
CREATE OR REPLACE VIEW public.public_profiles WITH (security_barrier=true) AS
SELECT p.id,p.user_id,p.first_name,p.last_name,p.avatar_url,p.bio,p.specialty,p.business_name,
 p.is_available,p.license_verified,p.vendor_type,p.customer_type,p.location,p.created_at
FROM public.profiles p WHERE
 p.user_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR
 (p.is_active AND p.verification_status='approved' AND
   ((p.license_verified AND public.has_role(p.user_id,'veterinarian')) OR public.has_role(p.user_id,'service_provider'))) OR
 EXISTS(SELECT 1 FROM public.consultations c WHERE
  (c.pet_owner_id=p.id OR c.veterinarian_id=p.id) AND
  (c.pet_owner_id=public.get_profile_id(auth.uid()) OR (c.veterinarian_id=public.get_profile_id(auth.uid()) AND public.is_verified_veterinarian(auth.uid()))));


CREATE FUNCTION public.audit_profile_verification() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO audit_logs(user_id,action,entity_type,entity_id,details) VALUES(auth.uid(),'profile_verification_changed','profile',NEW.id,
 jsonb_build_object('previous_status',OLD.verification_status,'status',NEW.verification_status,'license_verified',NEW.license_verified,'is_active',NEW.is_active));
 RETURN NEW;
END; $$;
CREATE TRIGGER audit_profile_verification AFTER UPDATE ON public.profiles FOR EACH ROW
 WHEN(OLD.license_verified IS DISTINCT FROM NEW.license_verified OR OLD.verification_status IS DISTINCT FROM NEW.verification_status OR OLD.is_active IS DISTINCT FROM NEW.is_active)
 EXECUTE FUNCTION public.audit_profile_verification();
NOTIFY pgrst,'reload schema';
COMMIT;
