-- Runs inside a transaction; randomized fixture IDs for live checks.
CREATE FUNCTION public.provider_test_assert(ok boolean, message text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %',message; END IF; RAISE NOTICE 'PASS: %',message; END $$;
CREATE FUNCTION public.provider_test_denied(statement text,message text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PASS: %',message; RETURN; END;
 RAISE EXCEPTION 'FAIL: expected rejection: %',message; END $$;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('71111111-1111-4111-8111-111111111111','provider-test-a@example.invalid','{}'),
 ('72222222-2222-4222-8222-222222222222','provider-test-b@example.invalid','{}');
SELECT provider_test_assert(NOT has_table_privilege('authenticated','public.provider_organizations','INSERT,UPDATE,DELETE'),'organization write privileges revoked');
SELECT provider_test_assert(NOT has_table_privilege('authenticated','public.provider_members','INSERT,UPDATE,DELETE'),'membership write privileges revoked');
SELECT provider_test_assert(NOT has_table_privilege('authenticated','public.provider_locations','INSERT,UPDATE,DELETE'),'location write privileges revoked');
SELECT provider_test_assert(NOT has_function_privilege('anon','public.save_provider_draft(jsonb,uuid)','EXECUTE'),'anonymous RPC privilege revoked');
SET LOCAL ROLE anon;
SELECT provider_test_denied($q$ SELECT save_provider_draft('{}') $q$,'anonymous registration denied');
SELECT provider_test_denied($q$ SELECT * FROM provider_organizations $q$,'anonymous cannot read drafts');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','71111111-1111-4111-8111-111111111111',true);
SELECT provider_test_denied($q$ INSERT INTO provider_organizations DEFAULT VALUES $q$,'direct registration blocked');
SELECT provider_test_denied($q$ INSERT INTO provider_members DEFAULT VALUES $q$,'membership forgery blocked');
SELECT provider_test_denied($q$ INSERT INTO provider_locations DEFAULT VALUES $q$,'direct location writes blocked');
SELECT save_provider_draft('{"name":"Fixture clinic","slug":"provider-fixture-a","provider_type":"veterinary_clinic","email":"Provider@example.invalid","city":"Abuja","state":"FCT","address":"12 Example Road"}');
SELECT provider_test_assert((SELECT count(*)=1 FROM provider_organizations WHERE slug='provider-fixture-a' AND verification_status='draft' AND status='inactive' AND created_by=auth.uid()),'draft is private and inactive');
SELECT provider_test_assert((SELECT count(*)=1 FROM provider_members WHERE user_id=auth.uid() AND member_role='owner' AND status='active'),'owner created atomically');
SELECT provider_test_assert((SELECT count(*)=1 FROM provider_locations WHERE city='Abuja' AND state='FCT' AND NOT is_active),'real location saved without invented address');
SELECT provider_test_assert((SELECT email='provider@example.invalid' FROM provider_organizations WHERE slug='provider-fixture-a'),'business email normalized');
SELECT provider_test_denied($q$ SELECT save_provider_draft('{"name":"Fixture","slug":"bad-owner","provider_type":"pet_store","created_by":"72222222-2222-4222-8222-222222222222"}') $q$,'client actor fields rejected');
SELECT provider_test_denied($q$ SELECT save_provider_draft('{"name":"Fixture","slug":"bad-status","verification_status":"approved"}') $q$,'client approval fields rejected');
SELECT provider_test_denied($q$ SELECT save_provider_draft('{"name":"Fixture","slug":"missing-location","provider_type":"pet_store","email":"p@example.invalid"}') $q$,'missing location rolls back registration');
SELECT provider_test_denied($q$ SELECT save_provider_draft('{"name":"Fixture","slug":"invalid-branch","provider_type":"pet_store","email":"p@example.invalid","city":"Abuja","state":"FCT","address":"12 Example Road","primary_location_name":"x"}') $q$,'invalid branch rolls back organization and member');
SELECT provider_test_assert((SELECT count(*)=1 FROM provider_members),'failed creations leave no orphan members');
SELECT provider_test_assert((SELECT count(*)=1 FROM provider_organizations),'failed creations leave no orphan organizations');
SELECT provider_test_denied($q$ SELECT save_provider_draft('{"name":"Fixture","slug":"provider-fixture-a","provider_type":"pet_store","email":"p@example.invalid","city":"Abuja","state":"FCT","address":"12 Example Road"}') $q$,'duplicate slug rejected');
SELECT save_provider_draft('{"name":"Updated clinic","slug":"provider-fixture-a","provider_type":"veterinary_clinic","email":"p@example.invalid","city":"Ibadan","state":"Oyo","address":"24 Updated Road","primary_location_name":"Main clinic"}',(SELECT id FROM provider_organizations WHERE slug='provider-fixture-a'));
SELECT provider_test_assert((SELECT count(*)=1 FROM provider_locations WHERE city='Ibadan' AND state='Oyo' AND name='Main clinic'),'draft edit synchronizes primary location');
SELECT provider_test_denied($q$ UPDATE provider_organizations SET verification_status='approved' $q$,'owner cannot self-approve');
SELECT provider_test_denied($q$ UPDATE provider_members SET member_role='manager' $q$,'owner cannot bypass membership workflow');
SELECT provider_test_denied($q$ DELETE FROM provider_organizations $q$,'client cannot delete registrations');
SELECT provider_test_denied($q$ SELECT save_provider_draft('{"name":"Fixture","slug":"changed-slug","provider_type":"veterinary_clinic","email":"p@example.invalid","city":"Abuja","state":"FCT","address":"12 Example Road"}',(SELECT id FROM provider_organizations)) $q$,'immutable slug protected');
RESET ROLE;
SELECT provider_test_assert((SELECT count(*)=2 FROM audit_logs WHERE entity_id IN (SELECT id FROM provider_organizations WHERE slug='provider-fixture-a') AND action IN ('provider_draft_created','provider_draft_updated')),'trusted create and edit audit events');
SELECT provider_test_assert((SELECT count(*)=0 FROM user_roles WHERE user_id='71111111-1111-4111-8111-111111111111' AND role<>'pet_owner'),'registration grants no professional or admin roles');
SELECT provider_test_assert((SELECT NOT license_verified FROM profiles WHERE user_id='71111111-1111-4111-8111-111111111111'),'registration does not verify professional credentials');
-- Record the fixture UUID privately in transaction state to probe access as another account.
SELECT set_config('provider_test.target',(SELECT id::text FROM provider_organizations WHERE slug='provider-fixture-a'),true);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','72222222-2222-4222-8222-222222222222',true);
SELECT provider_test_assert((SELECT count(*)=0 FROM provider_organizations),'other account sees no organizations');
SELECT provider_test_assert((SELECT count(*)=0 FROM provider_members),'other account sees no memberships');
SELECT provider_test_assert((SELECT count(*)=0 FROM provider_locations),'other account sees no locations');
SELECT provider_test_denied($q$ SELECT save_provider_draft('{"name":"Stolen clinic","slug":"provider-fixture-a","provider_type":"veterinary_clinic","email":"p@example.invalid","city":"Abuja","state":"FCT","address":"12 Example Road"}',current_setting('provider_test.target')::uuid) $q$,'another account cannot edit draft by known UUID');
RESET ROLE;
UPDATE provider_organizations SET verification_status='under_review' WHERE id=current_setting('provider_test.target')::uuid;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','71111111-1111-4111-8111-111111111111',true);
SELECT provider_test_denied($q$ SELECT save_provider_draft('{"name":"Changed clinic","slug":"provider-fixture-a","provider_type":"veterinary_clinic","email":"p@example.invalid","city":"Abuja","state":"FCT","address":"12 Example Road"}',current_setting('provider_test.target')::uuid) $q$,'submitted registration cannot be rewritten');
RESET ROLE;
UPDATE profiles SET is_active=false WHERE user_id='71111111-1111-4111-8111-111111111111';
SET LOCAL ROLE authenticated;
SELECT provider_test_denied($q$ SELECT save_provider_draft('{}') $q$,'inactive account cannot register');
RESET ROLE;

-- Validate the per-account cap independently of the fixture's submitted draft.
INSERT INTO public.provider_organizations(name,slug,provider_type,email,state,city,address,created_by)
 SELECT 'Cap fixture', 'provider-cap-'||n, 'pet_store','cap@example.invalid','FCT','Abuja','12 Cap Road','72222222-2222-4222-8222-222222222222' FROM generate_series(1,10) n;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','72222222-2222-4222-8222-222222222222',true);
SELECT provider_test_denied($q$ SELECT save_provider_draft('{"name":"Excess clinic","slug":"excess-draft","provider_type":"pet_store","email":"p@example.invalid","city":"Abuja","state":"FCT","address":"12 Example Road"}') $q$,'per-account organization cap enforced');
SELECT provider_test_assert((SELECT count(*)=10 FROM provider_organizations),'cap rejection leaves organization count unchanged');
SELECT set_config('request.jwt.claim.sub','',true);
SELECT provider_test_denied($q$ SELECT save_provider_draft('{}') $q$,'authenticated role without identity rejected');
RESET ROLE;
