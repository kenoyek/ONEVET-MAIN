CREATE INDEX IF NOT EXISTS contact_messages_inbox_order
  ON public.contact_messages (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS contact_messages_unread_inbox_order
  ON public.contact_messages (created_at DESC, id DESC) WHERE NOT is_read;

CREATE FUNCTION public.support_inbox_assert_admin()
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_active)
    OR NOT COALESCE(has_role(auth.uid(), 'admin'), false) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
END $$;

CREATE FUNCTION public.list_support_messages(unread_only boolean, before_created_at timestamptz, before_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM support_inbox_assert_admin();

  IF unread_only IS NULL OR (before_created_at IS NULL) <> (before_id IS NULL) THEN
    RAISE EXCEPTION 'Invalid support inbox filter or cursor' USING ERRCODE = '22023';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(page) ORDER BY created_at DESC, id DESC) FROM (
      SELECT id, name, email, subject, message, created_at, is_read
      FROM contact_messages
      WHERE (NOT unread_only OR NOT is_read)
        AND (before_created_at IS NULL OR (created_at, id) < (before_created_at, before_id))
      ORDER BY created_at DESC, id DESC
      LIMIT 26
    ) page
  ), '[]'::jsonb);
END $$;

CREATE FUNCTION public.set_support_message_read(message_id uuid, read_state boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM support_inbox_assert_admin();

  IF message_id IS NULL OR read_state IS NULL THEN
    RAISE EXCEPTION 'Message and read state required' USING ERRCODE = '22023';
  END IF;

  UPDATE contact_messages SET is_read = read_state WHERE id = message_id;
  RETURN FOUND;
END $$;

REVOKE ALL ON FUNCTION public.support_inbox_assert_admin(),
  public.list_support_messages(boolean, timestamptz, uuid), public.set_support_message_read(uuid, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_support_messages(boolean, timestamptz, uuid),
  public.set_support_message_read(uuid, boolean) TO authenticated;
