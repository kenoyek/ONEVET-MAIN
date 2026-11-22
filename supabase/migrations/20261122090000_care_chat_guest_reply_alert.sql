CREATE FUNCTION public.care_chat_reply_pending(guest_key uuid, after_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM care_chat_threads t
    JOIN care_chat_messages m ON m.thread_id = t.id
    WHERE t.id = encode(sha256(uuid_send(guest_key)), 'hex')
      AND t.created_at > now() - interval '7 days'
      AND m.sender = 'team'
      AND m.id > COALESCE(after_id, 0)
  );
$$;

REVOKE ALL ON FUNCTION public.care_chat_reply_pending(uuid, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.care_chat_reply_pending(uuid, bigint) TO anon, authenticated;
