ALTER TABLE public.contact_messages ADD COLUMN resolved_at timestamptz;
CREATE INDEX contact_messages_open_inbox_order
  ON public.contact_messages (created_at DESC, id DESC) WHERE resolved_at IS NULL;

CREATE FUNCTION public.list_support_messages(message_filter text, before_created_at timestamptz, before_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM support_inbox_assert_admin();

  IF message_filter IS NULL OR message_filter NOT IN ('open', 'unread', 'resolved', 'all')
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
        AND (before_created_at IS NULL OR (created_at, id) < (before_created_at, before_id))
      ORDER BY created_at DESC, id DESC
      LIMIT 26
    ) page
  ), '[]'::jsonb);
END $$;

CREATE FUNCTION public.set_support_message_resolved(message_id uuid, resolved_state boolean)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  resolution timestamptz;
BEGIN
  PERFORM support_inbox_assert_admin();

  IF message_id IS NULL OR resolved_state IS NULL THEN
    RAISE EXCEPTION 'Message and resolution state required' USING ERRCODE = '22023';
  END IF;

  UPDATE contact_messages AS m
  SET resolved_at = CASE WHEN resolved_state THEN COALESCE(m.resolved_at, now()) END
  WHERE m.id = message_id
  RETURNING m.resolved_at INTO resolution;
  IF NOT FOUND THEN RAISE EXCEPTION 'Support message unavailable' USING ERRCODE = 'P0002'; END IF;
  RETURN resolution;
END $$;

REVOKE ALL ON FUNCTION public.list_support_messages(text, timestamptz, uuid),
  public.set_support_message_resolved(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_support_messages(text, timestamptz, uuid),
  public.set_support_message_resolved(uuid, boolean) TO authenticated;

-- Preserve the previous request shape during rollout.
CREATE OR REPLACE FUNCTION public.list_support_messages(unread_only boolean, before_created_at timestamptz, before_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT public.list_support_messages(
    CASE unread_only WHEN true THEN 'unread' WHEN false THEN 'all' END, before_created_at, before_id
  );
$$;
