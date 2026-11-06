CREATE FUNCTION public.test_assert(ok boolean,message text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %',message; END IF; RAISE NOTICE 'PASS: %',message; END $$;
CREATE FUNCTION public.test_denied(statement text,message text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 BEGIN EXECUTE statement; EXCEPTION WHEN insufficient_privilege OR check_violation THEN RAISE NOTICE 'PASS: %',message; RETURN; END;
 RAISE EXCEPTION 'FAIL: expected denial: %',message; END $$;
CREATE FUNCTION public.test_fails(statement text,message text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PASS: %',message; RETURN; END;
 RAISE EXCEPTION 'FAIL: expected failure: %',message; END $$;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('11111111-1111-4111-8111-111111111111','owner-a@example.invalid','{"role":"admin","email_verified":true}'),
 ('22222222-2222-4222-8222-222222222222','owner-b@example.invalid','{"role":"not-an-enum-value"}'),
 ('33333333-3333-4333-8333-333333333333','vet-a@example.invalid','{"role":"veterinarian"}'),
 ('44444444-4444-4444-8444-444444444444','vet-b@example.invalid','{"role":"veterinarian"}'),
 ('55555555-5555-4555-8555-555555555555','pending-vet@example.invalid','{"role":"veterinarian"}');
SELECT test_assert(NOT public.has_role('11111111-1111-4111-8111-111111111111','admin'),'signup cannot assign admin from metadata');
SELECT test_assert((SELECT NOT email_verified FROM profiles WHERE user_id='11111111-1111-4111-8111-111111111111'),'signup cannot claim verified email');
SELECT test_assert(public.has_role('22222222-2222-4222-8222-222222222222','pet_owner'),'invalid signup role safely defaults');
UPDATE profiles SET verification_status='approved',license_verified=true WHERE user_id IN ('33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444');
SELECT test_assert((SELECT count(*)>=2 FROM audit_logs WHERE action='profile_verification_changed' AND entity_id IN (get_profile_id('33333333-3333-4333-8333-333333333333'),get_profile_id('44444444-4444-4444-8444-444444444444'))),'professional verification changes are audited by the server');
INSERT INTO service_listings(id,provider_id,title,category,price) VALUES
 ('a2000000-0000-4000-8000-000000000001',get_profile_id('33333333-3333-4333-8333-333333333333'),'Fixture veterinary service','vet_clinic',10),
 ('b2000000-0000-4000-8000-000000000001',get_profile_id('55555555-5555-4555-8555-555555555555'),'Unapproved fixture service','vet_clinic',10);
INSERT INTO subscription_plans(id,name,price,currency,duration_months) VALUES('a0000000-0000-4000-8000-000000000001','Fixture plan',10,'NGN',1);
INSERT INTO subscriptions(user_id,status,expires_at) VALUES('11111111-1111-4111-8111-111111111111','active',now()+interval '1 day');
INSERT INTO pets(id,owner_id,name,species) VALUES
 ('a1000000-0000-4000-8000-000000000001',get_profile_id('11111111-1111-4111-8111-111111111111'),'Fixture pet A','dog'),
 ('b1000000-0000-4000-8000-000000000001',get_profile_id('22222222-2222-4222-8222-222222222222'),'Fixture pet B','cat');
INSERT INTO notifications(user_id,title,message) VALUES('11111111-1111-4111-8111-111111111111','Fixture title','Fixture notification');

SET ROLE anon;
SELECT test_assert((SELECT count(*)=1 FROM care_service_directory WHERE id IN ('a2000000-0000-4000-8000-000000000001','b2000000-0000-4000-8000-000000000001')),'discovery publishes approved providers only');
SELECT test_assert((SELECT count(*)=0 FROM public_profiles WHERE user_id IN ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222')),'public directory hides private customer profiles');
SELECT test_denied($q$ SELECT handle_subscription_payment('11111111-1111-4111-8111-111111111111','a0000000-0000-4000-8000-000000000001','forged-reference') $q$,'anonymous cannot complete subscription payments');
SELECT test_denied($q$ SELECT handle_order_payment('a0000000-0000-4000-8000-000000000001','forged-reference') $q$,'anonymous cannot complete order payments');
SELECT test_denied($q$ INSERT INTO audit_logs(action,entity_type) VALUES('forged','system') $q$,'anonymous cannot forge audit logs');
SELECT test_denied($q$ INSERT INTO notifications(user_id,title,message) VALUES('11111111-1111-4111-8111-111111111111','Fixture title','forged') $q$,'anonymous cannot forge notifications');

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SELECT test_denied($q$ SELECT finalize_verified_payment('11111111-1111-4111-8111-111111111111','subscription','a0000000-0000-4000-8000-000000000001','forged-reference',1000,'NGN') $q$,'customers cannot invoke trusted settlement RPC');
INSERT INTO storage.objects(bucket_id,name) VALUES('pet-avatars','11111111-1111-4111-8111-111111111111/fixture.jpg');
SELECT test_denied($q$ INSERT INTO storage.objects(bucket_id,name) VALUES('pet-avatars','22222222-2222-4222-8222-222222222222/forged.jpg') $q$,'avatar uploads cannot target another account folder');
SELECT test_denied($q$ UPDATE public_profiles SET first_name='Forged public profile' $q$,'public directory is not a profile write path');
SELECT test_denied($q$ SELECT get_unread_notification_count('22222222-2222-4222-8222-222222222222') $q$,'notification counts cannot probe another account');
SELECT test_denied($q$ UPDATE profiles SET license_verified=true,verification_status='approved' WHERE user_id=auth.uid() $q$,'customer cannot self-verify');
UPDATE profiles SET first_name='Owner name',customer_type='both' WHERE user_id=auth.uid();
SELECT test_assert((SELECT customer_type='both' FROM profiles WHERE user_id=auth.uid()),'ordinary profile preferences still update');
UPDATE notifications SET is_read=true WHERE user_id=auth.uid();
SELECT test_assert((SELECT bool_and(is_read) FROM notifications WHERE user_id=auth.uid()),'recipient can mark notification read');
SELECT test_denied($q$ UPDATE notifications SET message='forged body' WHERE user_id=auth.uid() $q$,'recipient cannot rewrite notification content');
SELECT test_denied($q$ INSERT INTO consultations(pet_owner_id,pet_id,chief_complaint) VALUES(get_profile_id(auth.uid()),'b1000000-0000-4000-8000-000000000001','Foreign pet') $q$,'consultation rejects another owner animal');
INSERT INTO consultations(id,pet_owner_id,pet_id,chief_complaint) VALUES('c1000000-0000-4000-8000-000000000001',get_profile_id(auth.uid()),'a1000000-0000-4000-8000-000000000001','Fixture concern');
SELECT test_denied($q$ UPDATE consultations SET diagnosis='Owner diagnosis' WHERE id='c1000000-0000-4000-8000-000000000001' $q$,'customer cannot author clinical diagnosis');
SELECT test_assert((SELECT count(*)=1 FROM pets),'customer sees own pet only');

SELECT set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',false);
SELECT test_denied($q$ SELECT claim_consultation('c1000000-0000-4000-8000-000000000001') $q$,'pending vet cannot claim consultations');
SELECT test_assert((SELECT count(*)=0 FROM pets),'pending vet cannot browse animal records');
SELECT set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
SELECT test_assert((SELECT count(*)=1 FROM consultations WHERE id='c1000000-0000-4000-8000-000000000001' AND status='pending'),'approved vet sees waiting queue');
SELECT claim_consultation('c1000000-0000-4000-8000-000000000001');
SELECT test_assert((SELECT count(*)=1 FROM pets),'assigned vet sees assigned patient only');
UPDATE consultations SET diagnosis='Fixture diagnosis',status='completed',completed_at=now() WHERE id='c1000000-0000-4000-8000-000000000001';
SELECT test_assert((SELECT diagnosis='Fixture diagnosis' FROM consultations WHERE id='c1000000-0000-4000-8000-000000000001'),'assigned approved vet can author clinical record');
SELECT set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',false);
SELECT test_fails($q$ SELECT claim_consultation('c1000000-0000-4000-8000-000000000001') $q$,'second vet cannot claim occupied consultation');
SELECT test_assert((SELECT count(*)=0 FROM pets),'unassigned approved vet cannot browse pets');
RESET ROLE;

-- Trusted settlement: exact amount, reference uniqueness, idempotency and stock.
INSERT INTO marketplace_listings(id,seller_id,title,category,price,stock_quantity,is_active,is_approved) VALUES
 ('d1000000-0000-4000-8000-000000000001',get_profile_id('22222222-2222-4222-8222-222222222222'),'Fixture product','supplies',10,5,true,true);
INSERT INTO orders(id,customer_id,total_amount,shipping_address,phone_number) VALUES
 ('e1000000-0000-4000-8000-000000000001',get_profile_id('11111111-1111-4111-8111-111111111111'),1,'Fixture address','test');
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
INSERT INTO order_items(order_id,product_id,quantity,unit_price,total_price,seller_id) VALUES('e1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001',2,1,2,get_profile_id(auth.uid()));
SELECT test_assert((SELECT unit_price=10 AND total_price=20 FROM order_items),'order item pricing comes from server catalogue');
RESET ROLE;
SET ROLE service_role;
SELECT test_fails($q$ SELECT finalize_verified_payment('22222222-2222-4222-8222-222222222222','order','e1000000-0000-4000-8000-000000000001','fixture-order-1',2000,'NGN') $q$,'wrong owner settlement rejected');
SELECT test_fails($q$ SELECT finalize_verified_payment('11111111-1111-4111-8111-111111111111','order','e1000000-0000-4000-8000-000000000001','fixture-order-1',100,'NGN') $q$,'underpayment rejected');
SELECT test_assert(finalize_verified_payment('11111111-1111-4111-8111-111111111111','order','e1000000-0000-4000-8000-000000000001','fixture-order-1',2000,'NGN')='processed','valid order payment settles');
SELECT test_assert(finalize_verified_payment('11111111-1111-4111-8111-111111111111','order','e1000000-0000-4000-8000-000000000001','fixture-order-1',2000,'NGN')='already_processed','repeated payment is idempotent');
SELECT test_assert((SELECT stock_quantity=3 FROM marketplace_listings WHERE id='d1000000-0000-4000-8000-000000000001'),'stock decremented exactly once');
SELECT test_fails($q$ SELECT finalize_verified_payment('11111111-1111-4111-8111-111111111111','subscription','a0000000-0000-4000-8000-000000000001','fixture-order-1',2000,'NGN') $q$,'payment reference cannot be reused for another target');
SELECT test_assert(finalize_verified_payment('22222222-2222-4222-8222-222222222222','subscription','a0000000-0000-4000-8000-000000000001','fixture-subscription-1',1000,'NGN')='processed','valid subscription payment settles');
SELECT test_assert((SELECT count(*)=2 FROM payment_receipts WHERE reference IN ('fixture-order-1','fixture-subscription-1')),'trusted ledger contains only successful payments');
RESET ROLE;

-- Farm ownership checks also run against the exact bootstrap used on main.
INSERT INTO livestock_farms(id,owner_id,farm_name,farm_type,location_address,city,state) VALUES
 ('f1000000-0000-4000-8000-000000000001',get_profile_id('11111111-1111-4111-8111-111111111111'),'Fixture farm A','poultry','Test location','Test city','Test state'),
 ('f2000000-0000-4000-8000-000000000001',get_profile_id('22222222-2222-4222-8222-222222222222'),'Fixture farm B','poultry','Test location','Test city','Test state');
INSERT INTO livestock_batches(id,farm_id,batch_code,species,head_count) VALUES
 ('f3000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','fixture-core-group-a','poultry',100),
 ('f4000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000001','fixture-core-group-b','poultry',100);
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SELECT test_assert((SELECT count(*)=1 FROM livestock_farms),'main owner reads own farm only');
SELECT test_assert((SELECT count(*)=1 FROM livestock_batches),'main owner reads own group only');
SELECT test_denied($q$ INSERT INTO livestock_batches(farm_id,batch_code,species,head_count) VALUES('f2000000-0000-4000-8000-000000000001','forged-core-group','poultry',2) $q$,'main cross-owner group write denied');
INSERT INTO flock_health_records(batch_id,recorded_by_id,record_type,observations) VALUES('f3000000-0000-4000-8000-000000000001',get_profile_id(auth.uid()),'owner_observation','Fixture observation');
SELECT test_assert((SELECT count(*)=1 FROM flock_health_records),'main owner appends own observation');
SELECT test_denied($q$ INSERT INTO flock_health_records(batch_id,recorded_by_id,record_type,observations) VALUES('f4000000-0000-4000-8000-000000000001',get_profile_id(auth.uid()),'owner_observation','Cross-owner observation') $q$,'main cross-owner health write denied');
WITH removed AS (DELETE FROM livestock_farms RETURNING id) SELECT test_assert((SELECT count(*)=0 FROM removed),'main parent deletion cannot remove records');
SELECT set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
SELECT test_assert((SELECT count(*)=0 FROM livestock_farms),'main vet cannot browse unrelated farms');
RESET ROLE;

UPDATE profiles SET license_verified=false,verification_status='suspended' WHERE user_id='33333333-3333-4333-8333-333333333333';
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
SELECT test_assert((SELECT count(*)=0 FROM consultations WHERE id='c1000000-0000-4000-8000-000000000001'),'suspended vet loses clinical record access');
SELECT test_assert(NOT is_consultation_participant('c1000000-0000-4000-8000-000000000001',auth.uid()),'suspended vet loses consultation messaging access');
RESET ROLE;
