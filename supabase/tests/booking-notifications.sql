-- Shared synthetic fixture for sequential and two-session concurrency checks.
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('e8111111-1111-4111-8111-111111111111','alert-provider@example.invalid','{}'),
 ('e8222222-2222-4222-8222-222222222222','alert-customer@example.invalid','{}'),
 ('e8333333-3333-4333-8333-333333333333','alert-other@example.invalid','{}'),
 ('e8444444-4444-4444-8444-444444444444','alert-admin@example.invalid','{}');
INSERT INTO user_roles(user_id,role) VALUES('e8444444-4444-4444-8444-444444444444','admin');
INSERT INTO pets(id,owner_id,name,species) VALUES
 ('e9111111-1111-4111-8111-111111111111',get_profile_id('e8222222-2222-4222-8222-222222222222'),'Booking pet','dog'),
 ('e9222222-2222-4222-8222-222222222222',get_profile_id('e8333333-3333-4333-8333-333333333333'),'Other booking pet','cat');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','e8111111-1111-4111-8111-111111111111',true);
SELECT set_config('alert_test.org',save_provider_draft('{"name":"Booking fixture","slug":"alert-fixture-a","provider_type":"grooming_business","email":"booking@example.invalid","city":"Ibadan","state":"Oyo","address":"12 Private Clinic Road"}')::text,true);
SELECT set_config('alert_test.service',save_provider_service(current_setting('alert_test.org')::uuid,'{"name":"Grooming appointment","description":"A provider-declared grooming appointment.","category":"grooming","delivery_mode":"clinic_visit","duration_minutes":45,"base_price":15000}')::text,true);
INSERT INTO storage.objects(bucket_id,name) VALUES('provider-credentials',current_setting('alert_test.org')||'/e9333333-3333-4333-8333-333333333333.pdf');
SELECT register_provider_evidence(current_setting('alert_test.org')::uuid,'business_registration',current_setting('alert_test.org')||'/e9333333-3333-4333-8333-333333333333.pdf');
SELECT submit_provider_verification(current_setting('alert_test.org')::uuid);
SELECT set_config('request.jwt.claim.sub','e8444444-4444-4444-8444-444444444444',true);
SELECT review_provider_verification(current_setting('alert_test.org')::uuid,1,'approved','Registration evidence reviewed.');
SELECT set_config('request.jwt.claim.sub','e8111111-1111-4111-8111-111111111111',true);
SELECT set_provider_service_publication(current_setting('alert_test.service')::uuid,true,1);
SELECT save_provider_booking_schedule(current_setting('alert_test.org')::uuid,true,'[{"weekday":0,"opens":540,"closes":1020},{"weekday":1,"opens":540,"closes":1020},{"weekday":2,"opens":540,"closes":1020},{"weekday":3,"opens":540,"closes":1020},{"weekday":4,"opens":540,"closes":1020},{"weekday":5,"opens":540,"closes":1020},{"weekday":6,"opens":540,"closes":1020}]','{}',0);
SELECT set_config('alert_test.start',((now() AT TIME ZONE 'Africa/Lagos')::date+2)::text||'T09:00:00+01:00',true);
RESET ROLE;
CREATE FUNCTION public.alert_test_assert(ok boolean,message text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %',message; END IF; RAISE NOTICE 'PASS: %',message; END $$;
CREATE FUNCTION public.alert_test_reject(statement text,message text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PASS: %',message; RETURN; END; RAISE EXCEPTION 'FAIL: expected rejection: %',message; END $$;
SELECT alert_test_assert(NOT has_function_privilege('authenticated','notify_provider_booking_event()','EXECUTE'),'clients cannot dispatch booking alerts');
SELECT alert_test_assert(NOT has_table_privilege('authenticated','notifications','INSERT,DELETE'),'clients cannot forge or delete alerts');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','e8222222-2222-4222-8222-222222222222',true);
SELECT set_config('alert_test.request',request_provider_booking(current_setting('alert_test.service')::uuid,2,current_setting('alert_test.start')::timestamptz,gen_random_uuid(),'e9111111-1111-4111-8111-111111111111',NULL,'08012345678','','Private clinical note')::text,true);
SELECT set_config('request.jwt.claim.sub','e8111111-1111-4111-8111-111111111111',true);
SELECT alert_test_assert((SELECT count(*)=1 FROM notifications WHERE booking_id=current_setting('alert_test.request')::uuid AND booking_version=1 AND link='/appointments/'||current_setting('alert_test.request')),'one owner alert links directly to the new request');
SELECT alert_test_assert((SELECT count(*)=1 FROM notifications WHERE booking_id=current_setting('alert_test.request')::uuid AND message LIKE '%WAT%' AND message NOT LIKE '%08012345678%' AND message NOT LIKE '%Private clinical note%'),'alerts use WAT and omit private request details');
SELECT alert_test_reject($q$ UPDATE notifications SET booking_id=gen_random_uuid() WHERE booking_id=current_setting('alert_test.request')::uuid $q$,'recipients cannot rewrite booking context');
SELECT alert_test_reject($q$ UPDATE notifications SET link='/admin' WHERE booking_id=current_setting('alert_test.request')::uuid $q$,'recipients cannot rewrite navigation');
SELECT respond_provider_booking(current_setting('alert_test.request')::uuid,1,'confirmed','Confirmed.');
SELECT alert_test_assert((SELECT count(*)=1 FROM notifications WHERE booking_id=current_setting('alert_test.request')::uuid),'provider does not get an alert for its own confirmation');
SELECT set_config('request.jwt.claim.sub','e8222222-2222-4222-8222-222222222222',true);
SELECT alert_test_assert((SELECT count(*)=1 FROM notifications WHERE booking_id=current_setting('alert_test.request')::uuid AND booking_version=2 AND title='Booking confirmed'),'customer receives a structured confirmation alert');
SELECT alert_test_assert(get_unread_notification_count(auth.uid())=1,'unread count includes the confirmation');
UPDATE notifications SET is_read=true WHERE booking_id=current_setting('alert_test.request')::uuid;
UPDATE notifications SET is_read=true WHERE booking_id=current_setting('alert_test.request')::uuid;
SELECT alert_test_assert(get_unread_notification_count(auth.uid())=0,'repeated read actions do not corrupt the unread count');
SELECT set_config('request.jwt.claim.sub','e8333333-3333-4333-8333-333333333333',true);
SELECT alert_test_assert((SELECT count(*)=0 FROM notifications WHERE booking_id=current_setting('alert_test.request')::uuid),'other customers cannot see appointment alerts');
WITH changed AS (UPDATE notifications SET is_read=true WHERE booking_id=current_setting('alert_test.request')::uuid RETURNING id) SELECT alert_test_assert((SELECT count(*)=0 FROM changed),'other customers cannot acknowledge another account alerts');
SELECT set_config('request.jwt.claim.sub','e8222222-2222-4222-8222-222222222222',true);
SELECT set_config('alert_test.alternative',request_booking_reschedule(current_setting('alert_test.request')::uuid,2,2,current_setting('alert_test.start')::timestamptz+interval '15 minutes',gen_random_uuid(),'Later start requested.')::text,true);
SELECT set_config('request.jwt.claim.sub','e8111111-1111-4111-8111-111111111111',true);
SELECT alert_test_assert((SELECT count(*)=1 FROM notifications WHERE booking_id=current_setting('alert_test.alternative')::uuid AND title='Reschedule requested'),'provider receives a distinct reschedule request alert');
SELECT respond_provider_booking(current_setting('alert_test.alternative')::uuid,1,'confirmed','Replacement accepted.');
SELECT set_config('request.jwt.claim.sub','e8222222-2222-4222-8222-222222222222',true);
SELECT alert_test_assert((SELECT count(*)=0 FROM notifications WHERE booking_id=current_setting('alert_test.request')::uuid AND booking_version=3),'rescheduling does not send a misleading original-cancelled alert');
SELECT alert_test_assert((SELECT count(*)=1 FROM notifications WHERE booking_id=current_setting('alert_test.alternative')::uuid AND booking_version=2 AND title='Reschedule confirmed'),'replacement confirmation links to the accepted alternative');
SELECT set_config('request.jwt.claim.sub','e8444444-4444-4444-8444-444444444444',true);
SELECT respond_provider_booking(current_setting('alert_test.alternative')::uuid,2,'cancelled','Support cancellation for this fixture.');
RESET ROLE;
SELECT alert_test_assert((SELECT count(*)=2 FROM notifications WHERE booking_id=current_setting('alert_test.alternative')::uuid AND booking_version=3 AND title='Reschedule request cancelled'),'administrator cancellation notifies both participants');
SELECT alert_test_assert((SELECT count(*)=0 FROM notifications WHERE user_id='e8444444-4444-4444-8444-444444444444' AND booking_id=current_setting('alert_test.alternative')::uuid),'support actor receives no redundant personal alert');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','e8222222-2222-4222-8222-222222222222',true);
SELECT set_config('alert_test.second',request_provider_booking(current_setting('alert_test.service')::uuid,2,current_setting('alert_test.start')::timestamptz+interval '2 hours',gen_random_uuid(),'e9111111-1111-4111-8111-111111111111',NULL,'08012345678','','')::text,true);
SELECT set_config('request.jwt.claim.sub','e8111111-1111-4111-8111-111111111111',true);
SELECT respond_provider_booking(current_setting('alert_test.second')::uuid,1,'confirmed','Confirmed fixture.');
SELECT set_config('request.jwt.claim.sub','e8222222-2222-4222-8222-222222222222',true);
SELECT set_config('alert_test.closed',request_booking_reschedule(current_setting('alert_test.second')::uuid,2,2,current_setting('alert_test.start')::timestamptz+interval '3 hours',gen_random_uuid(),'Later start requested.')::text,true);
SELECT respond_provider_booking(current_setting('alert_test.second')::uuid,2,'cancelled','Cannot attend either time.');
RESET ROLE;
SELECT alert_test_assert((SELECT count(*)=0 FROM notifications WHERE booking_id=current_setting('alert_test.closed')::uuid AND booking_version=2),'closing a pending alternative does not duplicate the original cancellation alert');
SELECT alert_test_assert((SELECT count(*)=1 FROM notifications WHERE booking_id=current_setting('alert_test.second')::uuid AND booking_version=3 AND user_id='e8111111-1111-4111-8111-111111111111'),'original cancellation still alerts the other participant');
SELECT alert_test_reject($q$ INSERT INTO notifications(user_id,title,message,booking_id,booking_version) SELECT user_id,title,message,booking_id,booking_version FROM notifications WHERE booking_id=current_setting('alert_test.second')::uuid AND booking_version=3 LIMIT 1 $q$,'duplicate booking event alerts are constrained');
