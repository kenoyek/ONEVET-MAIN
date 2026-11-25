CREATE FUNCTION public.list_public_boarding_facilities(city_query text, after_slug text, state_query text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  state_term text := NULLIF(lower(btrim(state_query)), '');
  city_term text := NULLIF(lower(btrim(city_query)), '');
BEGIN
  IF char_length(city_term) > 80 OR char_length(state_term) > 80 OR char_length(after_slug) > 80 THEN
    RAISE EXCEPTION 'Invalid boarding directory filter' USING ERRCODE = '22023';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(listing) ORDER BY slug) FROM (
      SELECT name, slug, description, email, city, state
      FROM boarding_directory_entries
      WHERE (after_slug IS NULL OR slug > after_slug)
        AND (city_term IS NULL OR strpos(lower(city), city_term) > 0)
        AND (state_term IS NULL OR strpos(lower(state), state_term) > 0)
      ORDER BY slug LIMIT 26
    ) listing
  ), '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.list_public_boarding_facilities(text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_boarding_facilities(text,text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_public_boarding_facilities(city_query text, after_slug text)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT public.list_public_boarding_facilities(city_query, after_slug, NULL::text);
$$;
