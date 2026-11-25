INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
  ('aa511111-1111-4111-8111-111111111111','broadcast-admin@example.invalid','{}'),
  ('aa522222-2222-4222-8222-222222222222','broadcast-member@example.invalid','{}'),
  ('aa533333-3333-4333-8333-333333333333','broadcast-inactive@example.invalid','{}');
INSERT INTO public.user_roles(user_id,role) VALUES ('aa511111-1111-4111-8111-111111111111','admin');
UPDATE public.profiles SET is_active=false WHERE user_id='aa533333-3333-4333-8333-333333333333';

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','aa522222-2222-4222-8222-222222222222',true);
DO $$
BEGIN
  PERFORM public.send_admin_notification('aa544444-4444-4444-8444-444444444444','Denied','Must not send');
  RAISE EXCEPTION 'Non-admin broadcast succeeded';
EXCEPTION WHEN insufficient_privilege THEN NULL;
END $$;
SELECT set_config('request.jwt.claim.sub','aa511111-1111-4111-8111-111111111111',true);
DO $$
DECLARE sent integer;
BEGIN
  sent := public.send_admin_notification('aa544444-4444-4444-8444-444444444444',' Broadcast fixture ',' Review the announcement. ');
  IF sent < 2 OR sent IS DISTINCT FROM public.send_admin_notification(
    'aa544444-4444-4444-8444-444444444444','Broadcast fixture','Review the announcement.'
  ) THEN RAISE EXCEPTION 'Broadcast retry returned a different count'; END IF;
  BEGIN
    PERFORM public.send_admin_notification('aa544444-4444-4444-8444-444444444444','Changed','Review the announcement.');
    RAISE EXCEPTION 'Broadcast request ID accepted different content';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
END $$;

SELECT set_config('request.jwt.claim.sub','aa522222-2222-4222-8222-222222222222',true);
DO $$
BEGIN
  IF (SELECT count(*) FROM public.notifications
      WHERE title = 'Broadcast fixture' AND message = 'Review the announcement.' AND NOT is_read
        AND user_id = auth.uid()) <> 1 THEN
    RAISE EXCEPTION 'The recipient must see exactly one unread broadcast';
  END IF;
  IF EXISTS (SELECT 1 FROM public.notifications WHERE title='Broadcast fixture' AND user_id <> auth.uid()) THEN
    RAISE EXCEPTION 'Broadcast rows must be private to their recipients';
  END IF;
END $$;

RESET ROLE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.notifications WHERE title='Broadcast fixture'
      AND user_id='aa533333-3333-4333-8333-333333333333') THEN
    RAISE EXCEPTION 'Inactive account received a broadcast';
  END IF;
  IF (SELECT count(*) FROM public.audit_logs WHERE action='notification_broadcast_sent'
      AND entity_id='aa544444-4444-4444-8444-444444444444') <> 1 THEN
    RAISE EXCEPTION 'Broadcast should be audited once';
  END IF;
END $$;
