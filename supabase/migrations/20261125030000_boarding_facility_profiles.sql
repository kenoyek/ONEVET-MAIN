CREATE VIEW public.boarding_directory_entries WITH (security_barrier = true) AS
  SELECT o.name, o.slug, o.description, o.email, l.city, l.state
  FROM public.provider_organizations o
  JOIN public.provider_locations l ON l.provider_id = o.id AND l.is_primary
  WHERE o.provider_type = 'boarding_facility' AND o.boarding_listing_published
    AND public.provider_publication_eligible(o.id);

REVOKE ALL ON public.boarding_directory_entries FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_public_boarding_facilities(city_query text, after_slug text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE city_term text := NULLIF(lower(btrim(city_query)), '');
BEGIN
  IF char_length(city_term) > 80 OR char_length(after_slug) > 80 THEN
    RAISE EXCEPTION 'Invalid boarding directory filter' USING ERRCODE = '22023';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(listing) ORDER BY slug) FROM (
      SELECT name, slug, description, email, city, state
      FROM boarding_directory_entries
      WHERE (after_slug IS NULL OR slug > after_slug)
        AND (city_term IS NULL OR strpos(lower(city), city_term) > 0)
      ORDER BY slug LIMIT 26
    ) listing
  ), '[]'::jsonb);
END $$;

CREATE FUNCTION public.get_public_boarding_facility(facility_slug text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT to_jsonb(listing)
  FROM boarding_directory_entries listing
  WHERE listing.slug = facility_slug AND char_length(facility_slug) <= 80;
$$;

REVOKE ALL ON FUNCTION public.get_public_boarding_facility(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_boarding_facility(text) TO anon, authenticated;
