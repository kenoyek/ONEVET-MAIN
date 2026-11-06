-- Data-preserving repair for the inspected main-project baseline (18 original tables).
BEGIN;
SET LOCAL lock_timeout = '5s';

-- Payment completion is a trusted server capability, never a client RPC.
REVOKE ALL ON FUNCTION public.handle_order_payment(uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_subscription_payment(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_order_payment(uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_subscription_payment(uuid,uuid,text) TO service_role;

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Recipients read notifications" ON public.notifications FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY "Recipients mark notifications read" ON public.notifications FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
REVOKE INSERT, DELETE ON public.notifications FROM anon, authenticated;
REVOKE UPDATE ON public.notifications FROM anon, authenticated;
GRANT UPDATE(is_read) ON public.notifications TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_verified_veterinarian(uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id=uid AND license_verified=true
  AND verification_status='approved' AND is_active=true AND public.has_role(uid,'veterinarian'));
$$;
REVOKE ALL ON FUNCTION public.is_verified_veterinarian(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_verified_veterinarian(uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.protect_profile_verification()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF current_user IN ('postgres','service_role','supabase_admin') OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.license_verified IS TRUE OR NEW.verification_status NOT IN ('inactive','pending')
    OR NEW.email_verified IS TRUE OR NEW.phone_verified IS TRUE OR NEW.is_active IS DISTINCT FROM true
    OR NEW.is_available IS TRUE THEN RAISE EXCEPTION 'Verification fields are managed by the platform' USING ERRCODE='42501'; END IF;
 ELSE
  IF ROW(NEW.user_id,NEW.license_verified,NEW.verification_status,NEW.email_verified,NEW.phone_verified,NEW.is_active,NEW.email)
    IS DISTINCT FROM ROW(OLD.user_id,OLD.license_verified,OLD.verification_status,OLD.email_verified,OLD.phone_verified,OLD.is_active,OLD.email)
    THEN RAISE EXCEPTION 'Verification fields are managed by the platform' USING ERRCODE='42501'; END IF;
  IF ROW(NEW.license_number,NEW.license_url) IS DISTINCT FROM ROW(OLD.license_number,OLD.license_url) THEN
    NEW.license_verified:=false; NEW.verification_status:='pending'; NEW.is_available:=false;
  END IF;
  IF NEW.is_available AND NOT public.is_verified_veterinarian(auth.uid()) THEN
    RAISE EXCEPTION 'Professional approval is required before accepting consultations' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER protect_profile_verification BEFORE INSERT OR UPDATE ON public.profiles
 FOR EACH ROW EXECUTE FUNCTION public.protect_profile_verification();

-- Signup role and verified-email claims must not come from editable metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE requested_role public.app_role; v_status public.vendor_status;
BEGIN
 requested_role:=CASE WHEN NEW.raw_user_meta_data->>'role' IN ('pet_owner','service_provider','veterinarian')
  THEN (NEW.raw_user_meta_data->>'role')::public.app_role ELSE 'pet_owner'::public.app_role END;
 v_status:=CASE WHEN requested_role IN ('veterinarian','service_provider') THEN 'pending'::public.vendor_status ELSE 'inactive'::public.vendor_status END;
 INSERT INTO public.profiles(user_id,email,first_name,last_name,customer_type,vendor_type,country,state,city,email_verified,business_name,location,license_number,specialty,verification_status)
 VALUES(NEW.id,NEW.email,COALESCE(NEW.raw_user_meta_data->>'first_name',''),COALESCE(NEW.raw_user_meta_data->>'last_name',''),
  CASE WHEN NEW.raw_user_meta_data->>'customer_type' IN ('pet_owner','farm_owner','livestock_owner','both') THEN NEW.raw_user_meta_data->>'customer_type' ELSE 'pet_owner' END,
  NEW.raw_user_meta_data->>'vendor_type',COALESCE(NEW.raw_user_meta_data->>'country','Nigeria'),NEW.raw_user_meta_data->>'state',NEW.raw_user_meta_data->>'city',
  NEW.email_confirmed_at IS NOT NULL,NEW.raw_user_meta_data->>'business_name',NEW.raw_user_meta_data->>'location',NEW.raw_user_meta_data->>'license_number',NEW.raw_user_meta_data->>'specialty',v_status);
 INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,requested_role);
 RETURN NEW;
END; $$;

DROP POLICY IF EXISTS "Owners and Vets can view pets" ON public.pets;
CREATE POLICY "Owners and assigned approved vets read pets" ON public.pets FOR SELECT TO authenticated USING(
 owner_id=public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(),'admin') OR
 (public.is_verified_veterinarian(auth.uid()) AND EXISTS(SELECT 1 FROM public.consultations c WHERE c.pet_id=pets.id AND c.veterinarian_id=public.get_profile_id(auth.uid()))));

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
CREATE TRIGGER protect_consultation_write BEFORE INSERT OR UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION public.protect_consultation_write();

CREATE OR REPLACE FUNCTION public.claim_consultation(consultation_uuid uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE claimed uuid;
BEGIN
 IF NOT public.is_verified_veterinarian(auth.uid()) THEN RAISE EXCEPTION 'Professional approval required' USING ERRCODE='42501'; END IF;
 UPDATE consultations SET veterinarian_id=public.get_profile_id(auth.uid()),status='accepted',started_at=now()
 WHERE id=consultation_uuid AND status='pending' AND veterinarian_id IS NULL RETURNING id INTO claimed;
 IF claimed IS NULL THEN RAISE EXCEPTION 'Consultation is no longer available' USING ERRCODE='40001'; END IF;
 INSERT INTO audit_logs(user_id,action,entity_type,entity_id) VALUES(auth.uid(),'consultation_claimed','consultation',claimed);
 RETURN claimed;
END; $$;
REVOKE ALL ON FUNCTION public.claim_consultation(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.claim_consultation(uuid) TO authenticated;
CREATE POLICY "Approved vets view waiting consultation queue" ON public.consultations FOR SELECT TO authenticated
 USING(status='pending' AND veterinarian_id IS NULL AND public.is_verified_veterinarian(auth.uid()));

-- A curated public listing never includes emails, phone numbers, credentials, or medical records.
CREATE VIEW public.care_service_directory WITH (security_barrier=true) AS
 SELECT s.id,s.title AS name,s.description,s.category::text,s.price AS base_price,'NGN'::text AS currency,
 s.location,s.provider_id,p.first_name,p.last_name,p.business_name,p.specialty,p.avatar_url,
 p.license_verified,p.verification_status::text
 FROM public.service_listings s JOIN public.profiles p ON p.id=s.provider_id
 WHERE s.is_active AND s.price IS NOT NULL AND s.price>=0 AND p.is_active AND p.verification_status='approved'
 AND ((s.category='vet_clinic' AND p.license_verified AND public.has_role(p.user_id,'veterinarian'))
   OR (s.category<>'vet_clinic' AND public.has_role(p.user_id,'service_provider')));
GRANT SELECT ON public.care_service_directory TO anon,authenticated;
CREATE OR REPLACE VIEW public.public_profiles WITH (security_barrier=true) AS
SELECT p.id,p.user_id,p.first_name,p.last_name,p.avatar_url,p.bio,p.specialty,p.business_name,
 p.is_available,p.license_verified,p.vendor_type,p.customer_type,p.location,p.created_at
FROM public.profiles p WHERE
 p.user_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR
 (p.is_active AND p.verification_status='approved' AND
   ((p.license_verified AND public.has_role(p.user_id,'veterinarian')) OR public.has_role(p.user_id,'service_provider'))) OR
 EXISTS(SELECT 1 FROM public.consultations c WHERE
  (c.pet_owner_id=p.id OR c.veterinarian_id=p.id) AND
  (c.pet_owner_id=public.get_profile_id(auth.uid()) OR c.veterinarian_id=public.get_profile_id(auth.uid())));

DROP POLICY IF EXISTS "Authenticated users can upload pet avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Owners upload animal avatars" ON storage.objects FOR INSERT TO authenticated
 WITH CHECK(bucket_id IN ('pet-avatars','avatars') AND auth.uid()::text=(storage.foldername(name))[1]);

NOTIFY pgrst, 'reload schema';
COMMIT;
