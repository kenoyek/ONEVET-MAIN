CREATE FUNCTION public.care_chat_visitor_end(guest_key uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  chat_id text := encode(sha256(uuid_send(guest_key)), 'hex');
BEGIN
  IF guest_key IS NULL THEN
    RAISE EXCEPTION 'Guest key required' USING ERRCODE = '22023';
  END IF;

  PERFORM 1 FROM care_chat_threads
  WHERE id = chat_id AND created_at > now() - interval '7 days'
  FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;

  UPDATE care_chat_threads SET closed = true, updated_at = now()
  WHERE id = chat_id AND NOT closed;
  RETURN care_chat_snapshot(chat_id);
END $$;

REVOKE ALL ON FUNCTION public.care_chat_visitor_end(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.care_chat_visitor_end(uuid) TO anon, authenticated;
