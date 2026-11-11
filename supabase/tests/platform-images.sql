CREATE FUNCTION public.image_test_assert(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %',label; END IF; RAISE NOTICE 'PASS: %',label; END $$;
CREATE FUNCTION public.image_test_denied(statement text,expected_code text,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN IF SQLSTATE=expected_code THEN RAISE NOTICE 'PASS: %',label; RETURN; END IF; RAISE; END;
 RAISE EXCEPTION 'FAIL: expected denial: %',label;
END $$;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('ea111111-1111-4111-8111-111111111111','image-admin@example.invalid','{}'),
 ('ea222222-2222-4222-8222-222222222222','image-owner@example.invalid','{}');
INSERT INTO user_roles(user_id,role) VALUES('ea111111-1111-4111-8111-111111111111','admin');
SELECT image_test_assert((SELECT public AND file_size_limit=5242880 AND allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'] FROM storage.buckets WHERE id='platform-images'),'media bucket limits configured');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ea222222-2222-4222-8222-222222222222',true);
SELECT image_test_denied($q$ INSERT INTO storage.objects(bucket_id,name) VALUES('platform-images','ea222222-2222-4222-8222-222222222222/shop/ea333333-3333-4333-8333-333333333333.webp') $q$,'42501','ordinary user cannot upload editorial media');
SELECT set_config('request.jwt.claim.sub','ea111111-1111-4111-8111-111111111111',true);
SELECT image_test_denied($q$ INSERT INTO storage.objects(bucket_id,name) VALUES('platform-images','ea222222-2222-4222-8222-222222222222/shop/ea333333-3333-4333-8333-333333333333.webp') $q$,'42501','admin cannot upload to another user folder');
SELECT image_test_denied($q$ INSERT INTO storage.objects(bucket_id,name) VALUES('platform-images','ea111111-1111-4111-8111-111111111111/shop/ea333333-3333-4333-8333-333333333333.svg') $q$,'42501','SVG object path rejected');
INSERT INTO storage.objects(bucket_id,name) VALUES
 ('platform-images','ea111111-1111-4111-8111-111111111111/articles/ea333333-3333-4333-8333-333333333333.webp'),
 ('platform-images','ea111111-1111-4111-8111-111111111111/shop/ea444444-4444-4444-8444-444444444444.webp');
SELECT image_test_assert((SELECT count(*)=2 FROM storage.objects WHERE bucket_id='platform-images' AND name LIKE 'ea111111-1111-4111-8111-111111111111/%'),'active admin uploads covers and shop images');
WITH changed AS (UPDATE storage.objects SET name='overwritten.webp' WHERE bucket_id='platform-images' RETURNING *) SELECT image_test_assert(NOT EXISTS(SELECT 1 FROM changed),'published media cannot be overwritten');
WITH removed AS (DELETE FROM storage.objects WHERE bucket_id='platform-images' RETURNING *) SELECT image_test_assert(NOT EXISTS(SELECT 1 FROM removed),'published media cannot be deleted by clients');
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT image_test_assert((SELECT count(*)=2 FROM storage.objects WHERE bucket_id='platform-images' AND name LIKE 'ea111111-1111-4111-8111-111111111111/%'),'anonymous readers see public media');
SELECT image_test_denied($q$ INSERT INTO storage.objects(bucket_id,name) VALUES('platform-images','ea111111-1111-4111-8111-111111111111/shop/ea555555-5555-4555-8555-555555555555.webp') $q$,'42501','anonymous upload denied');
RESET ROLE;
UPDATE profiles SET is_active=false WHERE user_id='ea111111-1111-4111-8111-111111111111';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ea111111-1111-4111-8111-111111111111',true);
SELECT image_test_denied($q$ INSERT INTO storage.objects(bucket_id,name) VALUES('platform-images','ea111111-1111-4111-8111-111111111111/shop/ea555555-5555-4555-8555-555555555555.webp') $q$,'42501','suspended admin upload denied');
RESET ROLE;
