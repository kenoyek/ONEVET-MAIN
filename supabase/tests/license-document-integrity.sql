-- Local CI only. The outer test runner wraps all fixtures in a transaction.
SELECT set_config('request.jwt.claim.sub','',true);
INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES('ec111111-1111-4111-8111-111111111111','license-ci@example.invalid','{"role":"veterinarian"}');
INSERT INTO storage.objects(bucket_id,name) VALUES
 ('licenses','ec111111-1111-4111-8111-111111111111/reviewed.pdf'),
 ('licenses','ec111111-1111-4111-8111-111111111111/orphan.pdf');
UPDATE profiles SET license_url='ec111111-1111-4111-8111-111111111111/reviewed.pdf',license_verified=true,verification_status='approved',is_available=true
WHERE user_id='ec111111-1111-4111-8111-111111111111';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ec111111-1111-4111-8111-111111111111',true);
UPDATE storage.objects SET name='ec111111-1111-4111-8111-111111111111/changed.pdf'
WHERE bucket_id='licenses' AND name='ec111111-1111-4111-8111-111111111111/reviewed.pdf';
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE name='ec111111-1111-4111-8111-111111111111/reviewed.pdf') THEN RAISE EXCEPTION 'License overwrite was allowed'; END IF;
 RAISE NOTICE 'PASS: license object overwrite blocked';
END $$;
DELETE FROM storage.objects WHERE bucket_id='licenses' AND name='ec111111-1111-4111-8111-111111111111/reviewed.pdf';
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE name='ec111111-1111-4111-8111-111111111111/reviewed.pdf') THEN RAISE EXCEPTION 'Referenced license deletion was allowed'; END IF;
 RAISE NOTICE 'PASS: attached license deletion blocked';
END $$;
DELETE FROM storage.objects WHERE bucket_id='licenses' AND name='ec111111-1111-4111-8111-111111111111/orphan.pdf';
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM storage.objects WHERE name='ec111111-1111-4111-8111-111111111111/orphan.pdf') THEN RAISE EXCEPTION 'Orphan cleanup was blocked'; END IF;
 RAISE NOTICE 'PASS: orphan license cleanup remains allowed';
END $$;
INSERT INTO storage.objects(bucket_id,name) VALUES('licenses','ec111111-1111-4111-8111-111111111111/new.pdf');
UPDATE profiles SET license_url='ec111111-1111-4111-8111-111111111111/new.pdf'
WHERE user_id='ec111111-1111-4111-8111-111111111111';
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE user_id='ec111111-1111-4111-8111-111111111111' AND NOT license_verified AND verification_status='pending' AND NOT is_available) THEN RAISE EXCEPTION 'License replacement retained approval'; END IF;
 RAISE NOTICE 'PASS: replacement license resets approval and availability';
END $$;
RESET ROLE;

INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES('ec222222-2222-4222-8222-222222222222','license-admin-ci@example.invalid','{}');
INSERT INTO public.user_roles(user_id,role) VALUES ('ec222222-2222-4222-8222-222222222222','admin');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ec222222-2222-4222-8222-222222222222',true);
UPDATE profiles SET verification_status='rejected',license_verified=false
WHERE user_id='ec111111-1111-4111-8111-111111111111';
UPDATE profiles SET verification_status='rejected',license_verified=false
WHERE user_id='ec111111-1111-4111-8111-111111111111';
SELECT test_assert(NOT EXISTS(SELECT 1 FROM notifications WHERE title='Veterinary licence needs attention'),
  'reviewer cannot read the applicant decision notification');
SELECT set_config('request.jwt.claim.sub','ec111111-1111-4111-8111-111111111111',true);
SELECT test_assert((SELECT count(*) = 1 FROM notifications WHERE title='Veterinary licence needs attention'
  AND link='/profile' AND NOT is_read), 'rejection creates one private unread notification');
UPDATE profiles SET license_number='VCN-FIXTURE'
WHERE user_id=auth.uid();
SELECT set_config('request.jwt.claim.sub','ec222222-2222-4222-8222-222222222222',true);
UPDATE profiles SET verification_status='approved',license_verified=true
WHERE user_id='ec111111-1111-4111-8111-111111111111';
SELECT set_config('request.jwt.claim.sub','ec111111-1111-4111-8111-111111111111',true);
SELECT test_assert((SELECT count(*) = 1 FROM notifications WHERE title='Veterinary licence approved'
  AND link='/profile' AND NOT is_read), 'approval creates one private unread notification');
RESET ROLE;
