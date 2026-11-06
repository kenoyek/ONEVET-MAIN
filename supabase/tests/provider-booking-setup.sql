-- Shared synthetic fixture for sequential and two-session concurrency checks.
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('b8111111-1111-4111-8111-111111111111','booking-provider@example.invalid','{}'),
 ('b8222222-2222-4222-8222-222222222222','booking-customer@example.invalid','{}'),
 ('b8333333-3333-4333-8333-333333333333','booking-other@example.invalid','{}'),
 ('b8444444-4444-4444-8444-444444444444','booking-admin@example.invalid','{}');
INSERT INTO user_roles(user_id,role) VALUES('b8444444-4444-4444-8444-444444444444','admin');
INSERT INTO pets(id,owner_id,name,species) VALUES
 ('b9111111-1111-4111-8111-111111111111',get_profile_id('b8222222-2222-4222-8222-222222222222'),'Booking pet','dog'),
 ('b9222222-2222-4222-8222-222222222222',get_profile_id('b8333333-3333-4333-8333-333333333333'),'Other booking pet','cat');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','b8111111-1111-4111-8111-111111111111',true);
SELECT set_config('booking_test.org',save_provider_draft('{"name":"Booking fixture","slug":"booking-fixture-a","provider_type":"grooming_business","email":"booking@example.invalid","city":"Ibadan","state":"Oyo","address":"12 Private Clinic Road"}')::text,true);
SELECT set_config('booking_test.service',save_provider_service(current_setting('booking_test.org')::uuid,'{"name":"Grooming appointment","description":"A provider-declared grooming appointment.","category":"grooming","delivery_mode":"clinic_visit","duration_minutes":45,"base_price":15000}')::text,true);
INSERT INTO storage.objects(bucket_id,name) VALUES('provider-credentials',current_setting('booking_test.org')||'/b9333333-3333-4333-8333-333333333333.pdf');
SELECT register_provider_evidence(current_setting('booking_test.org')::uuid,'business_registration',current_setting('booking_test.org')||'/b9333333-3333-4333-8333-333333333333.pdf');
SELECT submit_provider_verification(current_setting('booking_test.org')::uuid);
SELECT set_config('request.jwt.claim.sub','b8444444-4444-4444-8444-444444444444',true);
SELECT review_provider_verification(current_setting('booking_test.org')::uuid,1,'approved','Registration evidence reviewed.');
SELECT set_config('request.jwt.claim.sub','b8111111-1111-4111-8111-111111111111',true);
SELECT set_provider_service_publication(current_setting('booking_test.service')::uuid,true,1);
SELECT save_provider_booking_schedule(current_setting('booking_test.org')::uuid,true,'[{"weekday":0,"opens":540,"closes":1020},{"weekday":1,"opens":540,"closes":1020},{"weekday":2,"opens":540,"closes":1020},{"weekday":3,"opens":540,"closes":1020},{"weekday":4,"opens":540,"closes":1020},{"weekday":5,"opens":540,"closes":1020},{"weekday":6,"opens":540,"closes":1020}]','{}',0);
SELECT set_config('booking_test.start',((now() AT TIME ZONE 'Africa/Lagos')::date+2)::text||'T09:00:00+01:00',true);
RESET ROLE;
