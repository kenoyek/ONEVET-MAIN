CREATE FUNCTION public.notify_vet_license_decision()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin')
    OR NOT public.has_role(NEW.user_id, 'veterinarian') THEN
    RETURN NEW;
  END IF;

  IF NEW.verification_status = 'approved' AND NEW.license_verified IS TRUE THEN
    INSERT INTO public.notifications(user_id, title, message, type, link, is_read)
    VALUES (NEW.user_id, 'Veterinary licence approved',
      'Your professional licence has been approved. Open your profile to see your verification status.',
      'success', '/profile', false);
  ELSIF NEW.verification_status = 'rejected' THEN
    INSERT INTO public.notifications(user_id, title, message, type, link, is_read)
    VALUES (NEW.user_id, 'Veterinary licence needs attention',
      'Your application could not be approved. Open your profile to check your licence details and upload a corrected document for review.',
      'warning', '/profile', false);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_vet_license_decision() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER notify_vet_license_decision
AFTER UPDATE ON public.profiles
FOR EACH ROW WHEN (
  OLD.verification_status = 'pending'
  AND NEW.verification_status IN ('approved', 'rejected')
)
EXECUTE FUNCTION public.notify_vet_license_decision();
