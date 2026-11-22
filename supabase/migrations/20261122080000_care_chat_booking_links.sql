ALTER TABLE public.care_chat_messages ADD COLUMN booking_category text CHECK (
  booking_category IS NULL OR (
    sender = 'team' AND booking_category IN ('all', 'veterinary', 'grooming', 'diagnostics', 'training')
  )
);

CREATE OR REPLACE FUNCTION public.care_chat_snapshot(chat_id text)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('closed', t.closed, 'messages', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('id', id, 'sender', sender, 'body', body,
      'created_at', created_at, 'booking_category', booking_category) ORDER BY id)
    FROM care_chat_messages WHERE thread_id = t.id
  ), '[]'::jsonb))
  FROM care_chat_threads t WHERE t.id = chat_id;
$$;

CREATE FUNCTION public.care_chat_append(chat_id text, message_sender text, message_key uuid, message_body text, booking_category_arg text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  message_text text := NULLIF(btrim(message_body, E' \t\n\r'), '');
  saved_body text;
  saved_category text;
BEGIN
  IF message_key IS NULL OR message_text IS NULL OR char_length(message_text) > 2000 THEN
    RAISE EXCEPTION 'Enter a message of 1–2000 characters' USING ERRCODE = '22023';
  END IF;

  IF booking_category_arg IS NOT NULL AND (
    message_sender <> 'team' OR booking_category_arg NOT IN ('all', 'veterinary', 'grooming', 'diagnostics', 'training')
  ) THEN
    RAISE EXCEPTION 'Invalid booking category' USING ERRCODE = '22023';
  END IF;

  SELECT body, booking_category INTO saved_body, saved_category FROM care_chat_messages
  WHERE thread_id = chat_id AND sender = message_sender AND request_id = message_key;
  IF FOUND THEN
    IF saved_body <> message_text OR saved_category IS DISTINCT FROM booking_category_arg THEN
      RAISE EXCEPTION 'Message retry conflict' USING ERRCODE = '22023';
    END IF;
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM care_chat_threads WHERE id = chat_id AND closed) THEN
    RAISE EXCEPTION 'This conversation is closed' USING ERRCODE = '55000';
  END IF;
  IF (SELECT count(*) FROM care_chat_messages WHERE thread_id = chat_id AND sender = message_sender
      AND created_at > now() - interval '1 minute') >= 5 THEN
    RAISE EXCEPTION 'Wait a minute before sending another message' USING ERRCODE = '54000';
  END IF;
  IF (SELECT count(*) FROM care_chat_messages WHERE thread_id = chat_id) >= 100 THEN
    RAISE EXCEPTION 'This conversation has reached its message limit' USING ERRCODE = '54001';
  END IF;
  INSERT INTO care_chat_messages (thread_id, request_id, sender, body, booking_category)
  VALUES (chat_id, message_key, message_sender, message_text, booking_category_arg);
  UPDATE care_chat_threads SET updated_at = now() WHERE id = chat_id;
END $$;

REVOKE ALL ON FUNCTION public.care_chat_append(text,text,uuid,text,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.care_chat_append(chat_id text, message_sender text, message_key uuid, message_body text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT public.care_chat_append(chat_id, message_sender, message_key, message_body, NULL::text);
$$;

CREATE FUNCTION public.care_chat_staff(chat_id text, message_key uuid,
  message_body text, close_chat boolean, booking_category_arg text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM care_chat_assert_staff();
  PERFORM 1 FROM care_chat_threads WHERE id = chat_id AND created_at > now() - interval '7 days' FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF message_body IS NOT NULL OR message_key IS NOT NULL OR booking_category_arg IS NOT NULL THEN
    PERFORM care_chat_append(chat_id, 'team', message_key, message_body, booking_category_arg);
  END IF;
  IF close_chat THEN
    UPDATE care_chat_threads SET closed = true, updated_at = now() WHERE id = chat_id AND NOT closed;
  END IF;
  RETURN care_chat_snapshot(chat_id);
END $$;

REVOKE ALL ON FUNCTION public.care_chat_staff(text,uuid,text,boolean,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.care_chat_staff(text,uuid,text,boolean,text) TO authenticated;

-- Keep the previous client signature available during the frontend rollout.
CREATE OR REPLACE FUNCTION public.care_chat_staff(chat_id text, message_key uuid DEFAULT NULL,
  message_body text DEFAULT NULL, close_chat boolean DEFAULT false)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT public.care_chat_staff(chat_id, message_key, message_body, close_chat, NULL::text);
$$;
