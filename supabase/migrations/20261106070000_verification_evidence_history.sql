BEGIN;
-- Retain the evidence and business details used by each decision across resubmissions.
-- Older events, if any, remain NULL rather than inventing a historical snapshot.
ALTER TABLE public.provider_verification_events ADD COLUMN document_ids uuid[], ADD COLUMN organization_snapshot jsonb;
ALTER TABLE public.provider_verification_events ADD CONSTRAINT provider_event_revision_unique UNIQUE(provider_id,revision);
CREATE FUNCTION public.capture_provider_verification_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE application public.provider_verification_cases;
BEGIN
 SELECT * INTO application FROM public.provider_verification_cases WHERE id=NEW.case_id AND provider_id=NEW.provider_id;
 IF NOT FOUND OR application.revision<>NEW.revision OR application.status<>NEW.status THEN
  RAISE EXCEPTION 'Review history must match the current application revision' USING ERRCODE='23514';
 END IF;
 NEW.document_ids:=application.document_ids;
 NEW.organization_snapshot:=application.organization_snapshot;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.capture_provider_verification_event() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER capture_provider_verification_event BEFORE INSERT ON public.provider_verification_events FOR EACH ROW EXECUTE FUNCTION public.capture_provider_verification_event();
COMMIT;
