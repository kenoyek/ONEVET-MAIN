ALTER TABLE public.provider_organizations ADD COLUMN boarding_listing_published boolean NOT NULL DEFAULT false;

CREATE FUNCTION public.set_boarding_listing(provider_uuid uuid, publish boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE facility public.provider_organizations;
BEGIN
  IF publish IS NULL THEN RAISE EXCEPTION 'Publication choice required' USING ERRCODE = '22023'; END IF;
  SELECT * INTO facility FROM provider_organizations
  WHERE id = provider_uuid AND provider_type = 'boarding_facility' AND created_by = auth.uid()
  FOR UPDATE;
  IF NOT FOUND OR NOT has_provider_team_access(provider_uuid, 'workspace') THEN
    RAISE EXCEPTION 'Boarding listing is unavailable' USING ERRCODE = '42501';
  END IF;
  IF publish AND NOT COALESCE(provider_publication_eligible(provider_uuid), false) THEN
    RAISE EXCEPTION 'Current organization approval and evidence are required' USING ERRCODE = '42501';
  END IF;
  IF facility.boarding_listing_published IS DISTINCT FROM publish THEN
    UPDATE provider_organizations SET boarding_listing_published = publish, updated_at = now()
    WHERE id = provider_uuid;
    INSERT INTO audit_logs(user_id, action, entity_type, entity_id)
    VALUES(auth.uid(), CASE WHEN publish THEN 'boarding_listing_published' ELSE 'boarding_listing_unpublished' END,
      'provider_organization', provider_uuid);
  END IF;
  RETURN publish;
END $$;

CREATE FUNCTION public.list_public_boarding_facilities(city_query text, after_slug text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE city_term text := NULLIF(lower(btrim(city_query)), '');
BEGIN
  IF char_length(city_term) > 80 OR char_length(after_slug) > 80 THEN
    RAISE EXCEPTION 'Invalid boarding directory filter' USING ERRCODE = '22023';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(listing) ORDER BY slug) FROM (
      SELECT o.name, o.slug, o.description, o.email, l.city, l.state
      FROM provider_organizations o
      JOIN provider_locations l ON l.provider_id = o.id AND l.is_primary
      WHERE o.provider_type = 'boarding_facility' AND o.boarding_listing_published
        AND (after_slug IS NULL OR o.slug > after_slug)
        AND (city_term IS NULL OR strpos(lower(l.city), city_term) > 0)
        AND provider_publication_eligible(o.id)
      ORDER BY o.slug LIMIT 26
    ) listing
  ), '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.set_boarding_listing(uuid, boolean),
  public.list_public_boarding_facilities(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_boarding_listing(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_boarding_facilities(text,text) TO anon, authenticated;
