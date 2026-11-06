-- Shared synthetic fixture for sequential and two-session concurrency checks.
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('d8111111-1111-4111-8111-111111111111','reschedule-provider@example.invalid','{}'),
 ('d8222222-2222-4222-8222-222222222222','reschedule-customer@example.invalid','{}'),
 ('d8333333-3333-4333-8333-333333333333','reschedule-other@example.invalid','{}'),
 ('d8444444-4444-4444-8444-444444444444','reschedule-admin@example.invalid','{}');
INSERT INTO user_roles(user_id,role) VALUES('d8444444-4444-4444-8444-444444444444','admin');
INSERT INTO pets(id,owner_id,name,species) VALUES
 ('d9111111-1111-4111-8111-111111111111',get_profile_id('d8222222-2222-4222-8222-222222222222'),'Booking pet','dog'),
 ('d9222222-2222-4222-8222-222222222222',get_profile_id('d8333333-3333-4333-8333-333333333333'),'Other booking pet','cat');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','d8111111-1111-4111-8111-111111111111',true);
SELECT set_config('reschedule_test.org',save_provider_draft('{"name":"Booking fixture","slug":"reschedule-fixture-a","provider_type":"grooming_business","email":"booking@example.invalid","city":"Ibadan","state":"Oyo","address":"12 Private Clinic Road"}')::text,true);
SELECT set_config('reschedule_test.service',save_provider_service(current_setting('reschedule_test.org')::uuid,'{"name":"Grooming appointment","description":"A provider-declared grooming appointment.","category":"grooming","delivery_mode":"clinic_visit","duration_minutes":45,"base_price":15000}')::text,true);
INSERT INTO storage.objects(bucket_id,name) VALUES('provider-credentials',current_setting('reschedule_test.org')||'/d9333333-3333-4333-8333-333333333333.pdf');
SELECT register_provider_evidence(current_setting('reschedule_test.org')::uuid,'business_registration',current_setting('reschedule_test.org')||'/d9333333-3333-4333-8333-333333333333.pdf');
SELECT submit_provider_verification(current_setting('reschedule_test.org')::uuid);
SELECT set_config('request.jwt.claim.sub','d8444444-4444-4444-8444-444444444444',true);
SELECT review_provider_verification(current_setting('reschedule_test.org')::uuid,1,'approved','Registration evidence reviewed.');
SELECT set_config('request.jwt.claim.sub','d8111111-1111-4111-8111-111111111111',true);
SELECT set_provider_service_publication(current_setting('reschedule_test.service')::uuid,true,1);
SELECT save_provider_booking_schedule(current_setting('reschedule_test.org')::uuid,true,'[{"weekday":0,"opens":540,"closes":1020},{"weekday":1,"opens":540,"closes":1020},{"weekday":2,"opens":540,"closes":1020},{"weekday":3,"opens":540,"closes":1020},{"weekday":4,"opens":540,"closes":1020},{"weekday":5,"opens":540,"closes":1020},{"weekday":6,"opens":540,"closes":1020}]','{}',0);
SELECT set_config('reschedule_test.start',((now() AT TIME ZONE 'Africa/Lagos')::date+2)::text||'T09:00:00+01:00',true);
RESET ROLE;
CREATE FUNCTION public.reschedule_test_assert(ok boolean,message text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %',message; END IF; RAISE NOTICE 'PASS: %',message; END $$;
CREATE FUNCTION public.reschedule_test_reject(statement text,message text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PASS: %',message; RETURN; END; RAISE EXCEPTION 'FAIL: expected rejection: %',message; END $$;
SELECT reschedule_test_assert(NOT has_function_privilege('anon','request_booking_reschedule(uuid,integer,integer,timestamptz,uuid,text)','EXECUTE'),'anonymous rescheduling revoked');
SELECT reschedule_test_assert(NOT has_function_privilege('authenticated','internal_provider_booking_slots(uuid,date,uuid)','EXECUTE'),'caller cannot exclude arbitrary bookings from slot checks');
SELECT reschedule_test_assert(NOT has_function_privilege('authenticated','internal_create_provider_booking(uuid,integer,timestamptz,uuid,uuid,uuid,text,text,text,uuid,integer,text)','EXECUTE'),'internal creation helper has no client execution path');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','d8222222-2222-4222-8222-222222222222',true);
SELECT set_config('reschedule_test.original',request_provider_booking(current_setting('reschedule_test.service')::uuid,2,current_setting('reschedule_test.start')::timestamptz,gen_random_uuid(),'d9111111-1111-4111-8111-111111111111',NULL,'08012345678','','Original customer notes')::text,true);
SELECT set_config('request.jwt.claim.sub','d8111111-1111-4111-8111-111111111111',true);
SELECT respond_provider_booking(current_setting('reschedule_test.original')::uuid,1,'confirmed','Original confirmation.');
SELECT reschedule_test_reject($q$ SELECT request_booking_reschedule(current_setting('reschedule_test.original')::uuid,2,2,current_setting('reschedule_test.start')::timestamptz+interval '15 minutes',gen_random_uuid(),'Move the booking please.') $q$,'provider cannot unilaterally request a customer reschedule');
SELECT set_config('request.jwt.claim.sub','d8333333-3333-4333-8333-333333333333',true);
SELECT reschedule_test_reject($q$ SELECT get_booking_reschedule_slots(current_setting('reschedule_test.original')::uuid,current_date+2) $q$,'other customer cannot inspect scoped replacement slots');
SELECT reschedule_test_reject($q$ SELECT request_booking_reschedule(current_setting('reschedule_test.original')::uuid,2,2,current_setting('reschedule_test.start')::timestamptz+interval '15 minutes',gen_random_uuid(),'Unauthorized move request.') $q$,'other customer cannot request a replacement');
SELECT set_config('request.jwt.claim.sub','d8222222-2222-4222-8222-222222222222',true);
SELECT reschedule_test_assert(EXISTS(SELECT 1 FROM get_booking_reschedule_slots(current_setting('reschedule_test.original')::uuid,(current_setting('reschedule_test.start')::timestamptz AT TIME ZONE 'Africa/Lagos')::date) WHERE start_at=current_setting('reschedule_test.start')::timestamptz+interval '15 minutes'),'rescheduling can overlap its own original confirmed slot');
SELECT reschedule_test_assert(NOT EXISTS(SELECT 1 FROM get_provider_booking_slots(current_setting('reschedule_test.service')::uuid,(current_setting('reschedule_test.start')::timestamptz AT TIME ZONE 'Africa/Lagos')::date) WHERE start_at=current_setting('reschedule_test.start')::timestamptz+interval '15 minutes'),'public slots still reserve the original appointment');
SELECT reschedule_test_reject($q$ SELECT request_booking_reschedule(current_setting('reschedule_test.original')::uuid,1,2,current_setting('reschedule_test.start')::timestamptz+interval '15 minutes',gen_random_uuid(),'Move the booking please.') $q$,'stale original versions cannot be rescheduled');
SELECT reschedule_test_reject($q$ SELECT request_booking_reschedule(current_setting('reschedule_test.original')::uuid,2,2,current_setting('reschedule_test.start')::timestamptz,gen_random_uuid(),'Move the booking please.') $q$,'reschedule must choose a different time');
SELECT set_config('reschedule_test.key',gen_random_uuid()::text,true);
SELECT set_config('reschedule_test.replacement',request_booking_reschedule(current_setting('reschedule_test.original')::uuid,2,2,current_setting('reschedule_test.start')::timestamptz+interval '15 minutes',current_setting('reschedule_test.key')::uuid,'A later start is needed.')::text,true);
SELECT reschedule_test_assert(request_booking_reschedule(current_setting('reschedule_test.original')::uuid,2,2,current_setting('reschedule_test.start')::timestamptz+interval '15 minutes',current_setting('reschedule_test.key')::uuid,'A later start is needed.')=current_setting('reschedule_test.replacement')::uuid,'reschedule retries reuse the same request');
SELECT reschedule_test_assert((SELECT status='confirmed' AND version=2 FROM provider_booking_requests WHERE id=current_setting('reschedule_test.original')::uuid),'requesting a reschedule preserves the original confirmation');
SELECT reschedule_test_assert((SELECT status='pending' AND replacement_for=current_setting('reschedule_test.original')::uuid AND replacement_version=2 AND customer_notes='Original customer notes' FROM provider_booking_requests WHERE id=current_setting('reschedule_test.replacement')::uuid),'replacement records the original version and preserves private notes');
SELECT reschedule_test_reject($q$ SELECT request_booking_reschedule(current_setting('reschedule_test.original')::uuid,2,2,current_setting('reschedule_test.start')::timestamptz+interval '1 hour',gen_random_uuid(),'Another alternative time.') $q$,'only one pending alternative per original is allowed');
SELECT set_config('request.jwt.claim.sub','d8111111-1111-4111-8111-111111111111',true);
SELECT respond_provider_booking(current_setting('reschedule_test.replacement')::uuid,1,'confirmed','Replacement accepted.');
SELECT reschedule_test_assert((SELECT status='cancelled' AND version=3 FROM provider_booking_requests WHERE id=current_setting('reschedule_test.original')::uuid),'accepted reschedule closes the original appointment');
SELECT reschedule_test_assert((SELECT status='confirmed' AND version=2 FROM provider_booking_requests WHERE id=current_setting('reschedule_test.replacement')::uuid),'accepted replacement becomes the sole confirmation');
SELECT reschedule_test_assert((SELECT count(*)=1 FROM provider_booking_requests WHERE provider_id=current_setting('reschedule_test.org')::uuid AND status='confirmed'),'overlapping replacement does not leave duplicate confirmations');
SELECT reschedule_test_assert((SELECT count(*)=3 FROM provider_booking_events WHERE booking_id=current_setting('reschedule_test.original')::uuid),'original history includes the trusted replacement cancellation');
RESET ROLE;
SELECT reschedule_test_assert((SELECT count(*)=1 FROM audit_logs WHERE action='provider_booking_rescheduled' AND entity_id=current_setting('reschedule_test.original')::uuid AND details->>'replacement_id'=current_setting('reschedule_test.replacement')),'reschedule audit links both appointment records');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','d8222222-2222-4222-8222-222222222222',true);
SELECT set_config('reschedule_test.declined',request_booking_reschedule(current_setting('reschedule_test.replacement')::uuid,2,2,current_setting('reschedule_test.start')::timestamptz+interval '2 hours',gen_random_uuid(),'Please consider this later time.')::text,true);
SELECT set_config('request.jwt.claim.sub','d8111111-1111-4111-8111-111111111111',true);
SELECT respond_provider_booking(current_setting('reschedule_test.declined')::uuid,1,'declined','Cannot provide the later time.');
SELECT reschedule_test_assert((SELECT status='confirmed' AND version=2 FROM provider_booking_requests WHERE id=current_setting('reschedule_test.replacement')::uuid),'declining an alternative leaves the confirmed original untouched');
SELECT set_config('request.jwt.claim.sub','d8222222-2222-4222-8222-222222222222',true);
SELECT set_config('reschedule_test.closed',request_booking_reschedule(current_setting('reschedule_test.replacement')::uuid,2,2,current_setting('reschedule_test.start')::timestamptz+interval '3 hours',gen_random_uuid(),'Please consider this later time.')::text,true);
SELECT respond_provider_booking(current_setting('reschedule_test.replacement')::uuid,2,'cancelled','Cannot attend the original booking.');
SELECT reschedule_test_assert((SELECT status='cancelled' AND version=2 FROM provider_booking_requests WHERE id=current_setting('reschedule_test.closed')::uuid),'cancelling the original closes its pending alternative');
SELECT reschedule_test_reject($q$ SELECT request_booking_reschedule(current_setting('reschedule_test.replacement')::uuid,3,2,current_setting('reschedule_test.start')::timestamptz+interval '4 hours',gen_random_uuid(),'Please move cancelled booking.') $q$,'cancelled originals cannot be rescheduled');
RESET ROLE;
-- Force a customer-calendar conflict that occurs after the original would be released.
-- All rows are synthetic and this statement runs only in the rollback fixture transaction.
INSERT INTO provider_booking_requests(provider_id,provider_owner_id,service_id,customer_id,request_key,pet_id,animal_snapshot,service_snapshot,start_at,end_at,base_fee,contact_phone,status)
 SELECT provider_id,provider_owner_id,service_id,customer_id,gen_random_uuid(),pet_id,animal_snapshot,service_snapshot,start_at+interval '5 hours',end_at+interval '5 hours',base_fee,contact_phone,'confirmed'
 FROM provider_booking_requests WHERE id=current_setting('reschedule_test.original')::uuid;
SELECT set_config('reschedule_test.conflict',(SELECT id::text FROM provider_booking_requests WHERE provider_id=current_setting('reschedule_test.org')::uuid AND status='confirmed'),true);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','d8222222-2222-4222-8222-222222222222',true);
SELECT set_config('reschedule_test.atomic',request_booking_reschedule(current_setting('reschedule_test.conflict')::uuid,1,2,current_setting('reschedule_test.start')::timestamptz+interval '6 hours',gen_random_uuid(),'Later appointment requested.')::text,true);
RESET ROLE;
-- Simulate a concurrent reservation between request and decision.
UPDATE provider_booking_requests SET start_at=current_setting('reschedule_test.start')::timestamptz+interval '6 hours',end_at=current_setting('reschedule_test.start')::timestamptz+interval '6 hours 45 minutes',status='confirmed',provider_owner_id='d8333333-3333-4333-8333-333333333333' WHERE id=current_setting('reschedule_test.closed')::uuid;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','d8111111-1111-4111-8111-111111111111',true);
SELECT reschedule_test_reject($q$ SELECT respond_provider_booking(current_setting('reschedule_test.atomic')::uuid,1,'confirmed','') $q$,'lost replacement slot rejects confirmation');
SELECT reschedule_test_assert((SELECT status='confirmed' AND version=1 FROM provider_booking_requests WHERE id=current_setting('reschedule_test.conflict')::uuid),'failed replacement confirmation preserves the original slot');
SELECT reschedule_test_assert((SELECT status='pending' AND version=1 FROM provider_booking_requests WHERE id=current_setting('reschedule_test.atomic')::uuid),'failed replacement leaves its request pending for review');
RESET ROLE;
-- A replacement may use newly agreed service terms without rewriting the old fee.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','d8222222-2222-4222-8222-222222222222',true);
SELECT set_config('reschedule_test.priced_original',request_provider_booking(current_setting('reschedule_test.service')::uuid,2,current_setting('reschedule_test.start')::timestamptz+interval '1 day',gen_random_uuid(),'d9111111-1111-4111-8111-111111111111',NULL,'08012345678','','Original price fixture')::text,true);
SELECT set_config('request.jwt.claim.sub','d8111111-1111-4111-8111-111111111111',true);
SELECT respond_provider_booking(current_setting('reschedule_test.priced_original')::uuid,1,'confirmed','Original price confirmed.');
SELECT set_provider_service_publication(current_setting('reschedule_test.service')::uuid,false,2);
SELECT save_provider_service(current_setting('reschedule_test.org')::uuid,'{"name":"Updated grooming terms","description":"A provider-declared grooming service with updated pricing.","category":"grooming","delivery_mode":"clinic_visit","duration_minutes":45,"base_price":20000}',current_setting('reschedule_test.service')::uuid,3);
SELECT set_provider_service_publication(current_setting('reschedule_test.service')::uuid,true,4);
SELECT set_config('request.jwt.claim.sub','d8222222-2222-4222-8222-222222222222',true);
SELECT set_config('reschedule_test.priced_alternative',request_booking_reschedule(current_setting('reschedule_test.priced_original')::uuid,2,5,current_setting('reschedule_test.start')::timestamptz+interval '1 day 1 hour',gen_random_uuid(),'I accept the updated terms for this alternative.')::text,true);
SELECT reschedule_test_assert((SELECT base_fee=20000 AND (service_snapshot->>'service_version')::integer=5 FROM provider_booking_requests WHERE id=current_setting('reschedule_test.priced_alternative')::uuid),'replacement snapshots the newly acknowledged service terms');
SELECT reschedule_test_assert((SELECT base_fee=15000 AND status='confirmed' AND version=2 FROM provider_booking_requests WHERE id=current_setting('reschedule_test.priced_original')::uuid),'new service pricing never rewrites the original confirmation fee');
RESET ROLE;
