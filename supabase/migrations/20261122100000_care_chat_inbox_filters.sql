CREATE FUNCTION public.care_chat_inbox_page(filter_status text, after_updated_at timestamptz, after_chat_id text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM care_chat_assert_staff();

  IF filter_status IS NULL OR filter_status NOT IN ('waiting', 'replied', 'closed')
    OR (after_updated_at IS NULL) <> (after_chat_id IS NULL) THEN
    RAISE EXCEPTION 'Invalid inbox filter or cursor' USING ERRCODE = '22023';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(inbox) ORDER BY
      CASE WHEN filter_status = 'waiting' THEN updated_at END ASC,
      CASE WHEN filter_status <> 'waiting' THEN updated_at END DESC,
      id ASC)
    FROM (
      SELECT t.id, t.closed, t.updated_at, latest.body AS preview, latest.sender = 'visitor' AS awaiting_reply
      FROM care_chat_threads t
      JOIN LATERAL (
        SELECT body, sender FROM care_chat_messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1
      ) latest ON true
      WHERE t.created_at > now() - interval '7 days'
        AND (
          (filter_status = 'closed' AND t.closed)
          OR (filter_status = 'waiting' AND NOT t.closed AND latest.sender = 'visitor')
          OR (filter_status = 'replied' AND NOT t.closed AND latest.sender = 'team')
        )
        AND (
          after_updated_at IS NULL
          OR (t.updated_at = after_updated_at AND t.id > after_chat_id)
          OR (filter_status = 'waiting' AND t.updated_at > after_updated_at)
          OR (filter_status <> 'waiting' AND t.updated_at < after_updated_at)
        )
      ORDER BY
        CASE WHEN filter_status = 'waiting' THEN t.updated_at END ASC,
        CASE WHEN filter_status <> 'waiting' THEN t.updated_at END DESC,
        t.id ASC
      LIMIT 26
    ) inbox
  ), '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.care_chat_inbox_page(text, timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.care_chat_inbox_page(text, timestamptz, text) TO authenticated;
