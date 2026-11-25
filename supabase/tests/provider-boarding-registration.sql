RESET ROLE;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('84111111-1111-4111-8111-111111111111','boarding-owner@example.invalid','{"role":"service_provider","vendor_type":"boarding_facility"}'),
 ('84222222-2222-4222-8222-222222222222','boarding-reviewer@example.invalid','{}');
INSERT INTO user_roles(user_id,role) VALUES ('84222222-2222-4222-8222-222222222222','admin');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','84111111-1111-4111-8111-111111111111',true);
SELECT set_config('boarding_test.org',save_provider_draft('{
  "name":"Fixture boarding facility","slug":"boarding-registration-fixture","provider_type":"boarding_facility",
  "email":"boarding@example.invalid","city":"Ibadan","state":"Oyo","address":"12 Example Road"
}')::text,true);
SELECT verify_test_assert((SELECT provider_type='boarding_facility' AND verification_status='draft' AND status='inactive'
  FROM provider_organizations WHERE id=current_setting('boarding_test.org')::uuid),'boarding registration creates an inactive private draft');
INSERT INTO storage.objects(bucket_id,name) VALUES
  ('provider-credentials',current_setting('boarding_test.org')||'/84333333-3333-4333-8333-333333333333.pdf');
SELECT register_provider_evidence(current_setting('boarding_test.org')::uuid,'business_registration',
  current_setting('boarding_test.org')||'/84333333-3333-4333-8333-333333333333.pdf');
SELECT submit_provider_verification(current_setting('boarding_test.org')::uuid);
SELECT verify_test_assert((SELECT verification_status='submitted'
  FROM provider_organizations WHERE id=current_setting('boarding_test.org')::uuid),'boarding provider can submit business evidence for review');
SELECT set_config('request.jwt.claim.sub','84222222-2222-4222-8222-222222222222',true);
SELECT review_provider_verification(current_setting('boarding_test.org')::uuid,1,'approved','');
SELECT verify_test_assert((SELECT verification_status='approved'
  FROM provider_organizations WHERE id=current_setting('boarding_test.org')::uuid),'admin can approve boarding organization evidence');
RESET ROLE;
