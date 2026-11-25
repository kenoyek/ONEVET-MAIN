CREATE FUNCTION public.send_admin_notification(request_id uuid, notification_title text, notification_message text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  actor uuid := auth.uid();
  clean_title text := btrim(notification_title, E' \t\n\r');
  clean_message text := btrim(notification_message, E' \t\n\r');
  previous jsonb;
  recipients integer;
BEGIN
  IF actor IS NULL OR NOT public.has_role(actor, 'admin')
    OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = actor AND is_active) THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;

  IF request_id IS NULL OR clean_title IS NULL OR clean_message IS NULL
    OR char_length(clean_title) NOT BETWEEN 1 AND 100
    OR char_length(clean_message) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Invalid notification' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(actor::text || ':notification:' || request_id::text, 0));
  SELECT details INTO previous FROM public.audit_logs
    WHERE user_id = actor AND action = 'notification_broadcast_sent' AND entity_id = request_id;
  IF FOUND THEN
    IF previous->>'title' IS DISTINCT FROM clean_title OR previous->>'message' IS DISTINCT FROM clean_message THEN
      RAISE EXCEPTION 'Notification request already used' USING ERRCODE = '22023';
    END IF;
    RETURN (previous->>'recipients')::integer;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  SELECT DISTINCT user_id, clean_title, clean_message, 'info', false
    FROM public.profiles WHERE is_active;
  GET DIAGNOSTICS recipients = ROW_COUNT;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (actor, 'notification_broadcast_sent', 'notification_broadcast', request_id,
    jsonb_build_object('title', clean_title, 'message', clean_message, 'recipients', recipients));
  RETURN recipients;
END;
$$;

REVOKE ALL ON FUNCTION public.send_admin_notification(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_admin_notification(uuid,text,text) TO authenticated;
