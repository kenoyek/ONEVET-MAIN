CREATE TABLE public.care_chat_threads (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed boolean NOT NULL DEFAULT false
);
CREATE TABLE public.care_chat_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  thread_id text NOT NULL REFERENCES public.care_chat_threads(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  sender text NOT NULL CHECK (sender IN ('visitor', 'team')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, sender, request_id)
);
ALTER TABLE public.care_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_chat_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.care_chat_threads, public.care_chat_messages FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.care_chat_snapshot(chat_id text)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('closed', t.closed, 'messages', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('id', id, 'sender', sender, 'body', body,
      'created_at', created_at) ORDER BY id)
    FROM care_chat_messages WHERE thread_id = t.id
  ), '[]'::jsonb))
  FROM care_chat_threads t WHERE t.id = chat_id;
$$;

CREATE FUNCTION public.care_chat_append(chat_id text, message_sender text, message_key uuid, message_body text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  message_text text := NULLIF(btrim(message_body, E' \t\n\r'), '');
  saved_body text;
BEGIN
  IF message_key IS NULL OR message_text IS NULL OR char_length(message_text) > 2000 THEN
    RAISE EXCEPTION 'Enter a message of 1–2000 characters' USING ERRCODE = '22023';
  END IF;

  SELECT body INTO saved_body FROM care_chat_messages
  WHERE thread_id = chat_id AND sender = message_sender AND request_id = message_key;
  IF FOUND THEN
    IF saved_body <> message_text THEN RAISE EXCEPTION 'Message retry conflict' USING ERRCODE = '22023'; END IF;
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
  INSERT INTO care_chat_messages (thread_id, request_id, sender, body)
  VALUES (chat_id, message_key, message_sender, message_text);
  UPDATE care_chat_threads SET updated_at = now() WHERE id = chat_id;
END $$;

CREATE FUNCTION public.care_chat_visitor(guest_key uuid, message_key uuid DEFAULT NULL, message_body text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  chat_id text := encode(sha256(uuid_send(guest_key)), 'hex');
  expiry timestamptz;
BEGIN
  IF guest_key IS NULL THEN RAISE EXCEPTION 'Guest key required' USING ERRCODE = '22023'; END IF;
  IF message_key IS NOT NULL OR message_body IS NOT NULL THEN
    IF message_key IS NULL OR NULLIF(btrim(message_body, E' \t\n\r'), '') IS NULL OR char_length(message_body) > 2000 THEN
      RAISE EXCEPTION 'Enter a message of 1–2000 characters' USING ERRCODE = '22023';
    END IF;
    SELECT created_at INTO expiry FROM care_chat_threads WHERE id = chat_id FOR UPDATE;
    IF NOT FOUND THEN
      PERFORM pg_advisory_xact_lock(762417);
      IF NOT EXISTS (SELECT 1 FROM care_chat_threads WHERE id = chat_id)
        AND (SELECT count(*) FROM care_chat_threads WHERE created_at > now() - interval '10 minutes') >= 30 THEN
        RAISE EXCEPTION 'Chat is busy. Try again shortly or use the contact form.' USING ERRCODE = '54000';
      END IF;
      INSERT INTO care_chat_threads (id) VALUES (chat_id) ON CONFLICT DO NOTHING;
      SELECT created_at INTO expiry FROM care_chat_threads WHERE id = chat_id FOR UPDATE;
    END IF;
    IF expiry <= now() - interval '7 days' THEN
      RAISE EXCEPTION 'This conversation has expired' USING ERRCODE = '55000';
    END IF;
    PERFORM care_chat_append(chat_id, 'visitor', message_key, message_body);
  ELSIF EXISTS (
    SELECT 1 FROM care_chat_threads WHERE id = chat_id AND created_at <= now() - interval '7 days'
  ) THEN
    RETURN jsonb_build_object('closed', true, 'messages', '[]'::jsonb);
  END IF;
  RETURN care_chat_snapshot(chat_id);
END $$;

CREATE FUNCTION public.care_chat_assert_staff()
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_active)
    OR NOT COALESCE(has_role(auth.uid(), 'admin'), false) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
END $$;

CREATE FUNCTION public.care_chat_inbox()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM care_chat_assert_staff();
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(inbox) ORDER BY closed, awaiting_reply DESC, updated_at DESC) FROM (
      SELECT t.id, t.closed, t.updated_at, latest.body AS preview, latest.sender = 'visitor' AS awaiting_reply
      FROM care_chat_threads t
      JOIN LATERAL (SELECT body, sender FROM care_chat_messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1) latest ON true
      WHERE t.created_at > now() - interval '7 days'
      ORDER BY t.closed, awaiting_reply DESC, t.updated_at DESC
      LIMIT 50
    ) inbox
  ), '[]'::jsonb);
END $$;

CREATE FUNCTION public.care_chat_staff(chat_id text, message_key uuid DEFAULT NULL,
  message_body text DEFAULT NULL, close_chat boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM care_chat_assert_staff();
  PERFORM 1 FROM care_chat_threads WHERE id = chat_id AND created_at > now() - interval '7 days' FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF message_body IS NOT NULL OR message_key IS NOT NULL THEN
    PERFORM care_chat_append(chat_id, 'team', message_key, message_body);
  END IF;
  IF close_chat THEN
    UPDATE care_chat_threads SET closed = true, updated_at = now() WHERE id = chat_id AND NOT closed;
  END IF;
  RETURN care_chat_snapshot(chat_id);
END $$;

CREATE INDEX care_chat_messages_thread ON public.care_chat_messages (thread_id, id DESC);
CREATE INDEX care_chat_threads_created ON public.care_chat_threads (created_at);

REVOKE ALL ON FUNCTION public.care_chat_snapshot(text), public.care_chat_append(text,text,uuid,text),
  public.care_chat_assert_staff(), public.care_chat_visitor(uuid,uuid,text),
  public.care_chat_inbox(), public.care_chat_staff(text,uuid,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.care_chat_visitor(uuid,uuid,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.care_chat_inbox(), public.care_chat_staff(text,uuid,text,boolean) TO authenticated;
