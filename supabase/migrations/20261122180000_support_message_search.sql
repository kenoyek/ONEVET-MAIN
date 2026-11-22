CREATE FUNCTION public.list_support_messages(message_filter text, before_created_at timestamptz, before_id uuid, search_text text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE term text := NULLIF(lower(btrim(search_text, E' \t\n\r')), '');
BEGIN
  PERFORM support_inbox_assert_admin();

  IF message_filter IS NULL OR message_filter NOT IN ('open', 'unread', 'resolved', 'all')
    OR char_length(term) > 254
    OR (before_created_at IS NULL) <> (before_id IS NULL) THEN
    RAISE EXCEPTION 'Invalid support inbox filter or cursor' USING ERRCODE = '22023';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(page) ORDER BY created_at DESC, id DESC) FROM (
      SELECT id, name, email, subject, message, created_at, is_read, resolved_at
      FROM contact_messages
      WHERE (
        message_filter = 'all'
        OR (message_filter = 'open' AND resolved_at IS NULL)
        OR (message_filter = 'unread' AND NOT is_read)
        OR (message_filter = 'resolved' AND resolved_at IS NOT NULL)
      )
        AND (
          term IS NULL
          OR strpos(lower(name), term) > 0
          OR strpos(lower(email), term) > 0
          OR strpos(lower(subject), term) > 0
        )
        AND (before_created_at IS NULL OR (created_at, id) < (before_created_at, before_id))
      ORDER BY created_at DESC, id DESC
      LIMIT 26
    ) page
  ), '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.list_support_messages(text, timestamptz, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_support_messages(text, timestamptz, uuid, text) TO authenticated;

-- Keep the unfiltered signature available during the frontend rollout.
CREATE OR REPLACE FUNCTION public.list_support_messages(message_filter text, before_created_at timestamptz, before_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT public.list_support_messages(message_filter, before_created_at, before_id, NULL::text);
$$;
