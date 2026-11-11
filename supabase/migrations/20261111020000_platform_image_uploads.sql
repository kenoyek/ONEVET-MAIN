-- Public editorial/product media only. Credentials remain in their private buckets.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('platform-images','platform-images',true,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO UPDATE SET public=true,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.can_upload_platform_image(object_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT auth.uid() IS NOT NULL AND has_role(auth.uid(),'admin')
 AND EXISTS(SELECT 1 FROM profiles WHERE user_id=auth.uid() AND is_active)
 AND object_name ~ ('^'||auth.uid()::text||'/(articles|shop)/[0-9a-f-]{36}\.(webp|png|jpg|jpeg)$');
$$;
REVOKE ALL ON FUNCTION public.can_upload_platform_image(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_upload_platform_image(text) TO authenticated,service_role;

DROP POLICY IF EXISTS platform_images_read ON storage.objects;
CREATE POLICY platform_images_read ON storage.objects FOR SELECT TO anon,authenticated USING(bucket_id='platform-images');
DROP POLICY IF EXISTS platform_images_insert ON storage.objects;
CREATE POLICY platform_images_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='platform-images' AND public.can_upload_platform_image(name));
-- Restrictive guards keep broader existing bucket policies from granting media mutation.
DROP POLICY IF EXISTS platform_images_insert_guard ON storage.objects;
CREATE POLICY platform_images_insert_guard ON storage.objects AS RESTRICTIVE FOR INSERT TO anon,authenticated
WITH CHECK(CASE WHEN bucket_id='platform-images' THEN public.can_upload_platform_image(name) ELSE true END);
DROP POLICY IF EXISTS platform_images_no_overwrite ON storage.objects;
CREATE POLICY platform_images_no_overwrite ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon,authenticated
USING(bucket_id<>'platform-images') WITH CHECK(bucket_id<>'platform-images');
DROP POLICY IF EXISTS platform_images_no_delete ON storage.objects;
CREATE POLICY platform_images_no_delete ON storage.objects AS RESTRICTIVE FOR DELETE TO anon,authenticated USING(bucket_id<>'platform-images');
-- Removing/replacing an image changes its article/gallery reference only. Immutable objects
-- preserve published images and browser draft recovery; trusted maintenance can clean orphans.
