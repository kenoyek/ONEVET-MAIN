CREATE FUNCTION public.care_chat_waiting_count()
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM care_chat_assert_staff();

  RETURN (
    SELECT count(*)::integer
    FROM care_chat_threads t
    JOIN LATERAL (
      SELECT sender FROM care_chat_messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1
    ) latest ON true
    WHERE NOT t.closed
      AND t.created_at > now() - interval '7 days'
      AND latest.sender = 'visitor'
  );
END $$;

REVOKE ALL ON FUNCTION public.care_chat_waiting_count() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.care_chat_waiting_count() TO authenticated;
