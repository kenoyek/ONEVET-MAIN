-- License replacements must use a new object path so profile verification resets.
-- Restrictive policies intersect existing owner policies without granting any access.
DROP POLICY IF EXISTS "onevet_license_no_overwrite" ON storage.objects;
CREATE POLICY "onevet_license_no_overwrite" ON storage.objects AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (bucket_id <> 'licenses') WITH CHECK (bucket_id <> 'licenses');

DROP POLICY IF EXISTS "onevet_license_keep_referenced" ON storage.objects;
CREATE POLICY "onevet_license_keep_referenced" ON storage.objects AS RESTRICTIVE
  FOR DELETE TO authenticated USING (
    bucket_id <> 'licenses' OR NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.license_url = storage.objects.name
        OR right(split_part(p.license_url, '?', 1), length('/licenses/' || storage.objects.name)) = '/licenses/' || storage.objects.name
    )
  );
