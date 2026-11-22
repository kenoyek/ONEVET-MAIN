CREATE TABLE public.support_message_notes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  request_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, author_id, request_id)
);

CREATE INDEX support_message_notes_page ON public.support_message_notes (message_id, id DESC);
ALTER TABLE public.support_message_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_message_notes FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.list_support_message_notes(target_message uuid, before_note bigint)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM support_inbox_assert_admin();

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(page) ORDER BY id DESC) FROM (
      SELECT id, author_name, body, created_at
      FROM support_message_notes
      WHERE message_id = target_message AND (before_note IS NULL OR id < before_note)
      ORDER BY id DESC
      LIMIT 26
    ) page
  ), '[]'::jsonb);
END $$;

CREATE FUNCTION public.add_support_message_note(target_message uuid, note_request uuid, note_body text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  normalized_body text := NULLIF(btrim(note_body, E' \t\n\r'), '');
  moderator_name text;
  saved_body text;
BEGIN
  PERFORM support_inbox_assert_admin();

  IF target_message IS NULL OR note_request IS NULL OR normalized_body IS NULL OR char_length(normalized_body) > 1000 THEN
    RAISE EXCEPTION 'A note must contain 1–1000 characters' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(NULLIF(btrim(concat_ws(' ', first_name, last_name)), ''), 'Administrator')
  INTO moderator_name FROM profiles WHERE user_id = auth.uid();

  INSERT INTO support_message_notes (message_id, author_id, author_name, request_id, body)
  VALUES (target_message, auth.uid(), moderator_name, note_request, normalized_body)
  ON CONFLICT (message_id, author_id, request_id) DO NOTHING;
  IF FOUND THEN RETURN; END IF;

  SELECT body INTO saved_body FROM support_message_notes
  WHERE message_id = target_message AND author_id = auth.uid() AND request_id = note_request;
  IF saved_body IS DISTINCT FROM normalized_body THEN
    RAISE EXCEPTION 'Note retry conflict' USING ERRCODE = '22023';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.list_support_message_notes(uuid, bigint),
  public.add_support_message_note(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_support_message_notes(uuid, bigint),
  public.add_support_message_note(uuid, uuid, text) TO authenticated;
