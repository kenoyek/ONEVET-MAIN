ALTER TABLE public.care_chat_threads
  ADD COLUMN assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE FUNCTION public.care_chat_current_owner(chat_id text)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT t.assigned_to
  FROM care_chat_threads t
  WHERE t.id = chat_id
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = t.assigned_to AND p.is_active)
    AND has_role(t.assigned_to, 'admin');
$$;

CREATE FUNCTION public.care_chat_staff_snapshot(chat_id text)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT care_chat_snapshot(chat_id) || jsonb_build_object('owner_id', owner.id,
    'owned_by_me', COALESCE(owner.id = auth.uid(), false))
  FROM (SELECT care_chat_current_owner(chat_id) AS id) owner;
$$;

CREATE OR REPLACE FUNCTION public.care_chat_staff(chat_id text, message_key uuid,
  message_body text, close_chat boolean, booking_category_arg text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  current_owner uuid;
  sending boolean := message_body IS NOT NULL OR message_key IS NOT NULL OR booking_category_arg IS NOT NULL;
  already_closed boolean;
BEGIN
  PERFORM care_chat_assert_staff();
  SELECT closed INTO already_closed FROM care_chat_threads
  WHERE id = chat_id AND created_at > now() - interval '7 days' FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF sending OR (close_chat AND NOT already_closed) THEN
    current_owner := care_chat_current_owner(chat_id);
    IF current_owner IS NOT NULL AND current_owner <> auth.uid() THEN
      RAISE EXCEPTION 'This chat is assigned to another staff member' USING ERRCODE = '55006';
    END IF;
  END IF;
  IF sending THEN
    PERFORM care_chat_append(chat_id, 'team', message_key, message_body, booking_category_arg);
    IF current_owner IS NULL AND NOT already_closed THEN
      UPDATE care_chat_threads SET assigned_to = auth.uid() WHERE id = chat_id;
    END IF;
  END IF;
  IF close_chat THEN
    UPDATE care_chat_threads SET closed = true, updated_at = now() WHERE id = chat_id AND NOT closed;
  END IF;
  RETURN care_chat_staff_snapshot(chat_id);
END $$;

CREATE FUNCTION public.care_chat_assign(chat_id text, expected_owner uuid, release_chat boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  current_owner uuid;
  next_owner uuid;
BEGIN
  PERFORM care_chat_assert_staff();
  PERFORM 1 FROM care_chat_threads WHERE id = chat_id AND NOT closed
    AND created_at > now() - interval '7 days' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chat unavailable' USING ERRCODE = '55000';
  END IF;
  IF release_chat IS NULL THEN RAISE EXCEPTION 'Assignment action required' USING ERRCODE = '22023'; END IF;

  current_owner := care_chat_current_owner(chat_id);
  next_owner := CASE WHEN release_chat THEN NULL ELSE auth.uid() END;
  IF current_owner IS NOT DISTINCT FROM next_owner THEN
    RETURN care_chat_staff_snapshot(chat_id);
  END IF;
  IF current_owner IS DISTINCT FROM expected_owner OR (release_chat AND current_owner <> auth.uid()) THEN
    RAISE EXCEPTION 'Chat ownership changed' USING ERRCODE = '55006';
  END IF;
  UPDATE care_chat_threads SET assigned_to = next_owner WHERE id = chat_id;
  RETURN care_chat_staff_snapshot(chat_id);
END $$;

REVOKE ALL ON FUNCTION public.care_chat_current_owner(text), public.care_chat_staff_snapshot(text),
  public.care_chat_assign(text, uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.care_chat_assign(text, uuid, boolean) TO authenticated;
