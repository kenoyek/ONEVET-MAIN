CREATE OR REPLACE FUNCTION public.list_public_boarding_facilities(city_query text, after_slug text, state_query text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  state_term text := NULLIF(lower(btrim(state_query)), '');
  fct_aliases constant text[] := ARRAY[
    'federal capital territory', 'fct', 'abuja', 'abuja fct', 'abuja (fct)', 'fct abuja', 'fct (abuja)'
  ];
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
        AND (state_term IS NULL OR strpos(lower(state), state_term) > 0
          OR (state_term = ANY(fct_aliases) AND lower(btrim(state)) = ANY(fct_aliases)))
      ORDER BY slug LIMIT 26
    ) listing
  ), '[]'::jsonb);
END $$;
