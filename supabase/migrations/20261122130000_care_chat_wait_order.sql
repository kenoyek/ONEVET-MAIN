CREATE FUNCTION public.care_chat_inbox_page(filter_status text, after_updated_at timestamptz, after_chat_id text, filter_assignment text, sort_by_first_wait boolean)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE viewer uuid := auth.uid();
BEGIN
  PERFORM care_chat_assert_staff();

  IF filter_status IS NULL OR filter_status NOT IN ('waiting', 'replied', 'closed')
    OR filter_assignment IS NULL OR filter_assignment NOT IN ('all', 'mine', 'unassigned')
    OR sort_by_first_wait IS NULL
    OR (after_updated_at IS NULL) <> (after_chat_id IS NULL) THEN
    RAISE EXCEPTION 'Invalid inbox filter or cursor' USING ERRCODE = '22023';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(inbox) ORDER BY
      CASE WHEN filter_status = 'waiting' THEN queue_at END ASC,
      CASE WHEN filter_status <> 'waiting' THEN queue_at END DESC,
      id ASC)
    FROM (
      SELECT t.id, t.closed, t.updated_at, latest.body AS preview, latest.sender = 'visitor' AS awaiting_reply,
        queue.position_at AS queue_at,
        CASE
          WHEN ownership.owner_id IS NULL THEN 'unassigned'
          WHEN ownership.owner_id = viewer THEN 'mine'
          ELSE 'teammate'
        END AS assignment
      FROM care_chat_threads t
      JOIN LATERAL (
        SELECT body, sender FROM care_chat_messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1
      ) latest ON true
      CROSS JOIN LATERAL (
        SELECT CASE WHEN t.assigned_to IS NOT NULL THEN care_chat_current_owner(t.id) END AS owner_id
      ) ownership
      LEFT JOIN LATERAL (
        SELECT m.created_at
        FROM care_chat_messages m
        WHERE sort_by_first_wait AND filter_status = 'waiting' AND NOT t.closed AND latest.sender = 'visitor'
          AND m.thread_id = t.id AND m.sender = 'visitor'
          AND m.id > COALESCE((
            SELECT id FROM care_chat_messages
            WHERE thread_id = t.id AND sender = 'team'
            ORDER BY id DESC LIMIT 1
          ), 0)
        ORDER BY m.id LIMIT 1
      ) first_waiting ON true
      CROSS JOIN LATERAL (
        SELECT COALESCE(first_waiting.created_at, t.updated_at) AS position_at
      ) queue
      WHERE t.created_at > now() - interval '7 days'
        AND (
          (filter_status = 'closed' AND t.closed)
          OR (filter_status = 'waiting' AND NOT t.closed AND latest.sender = 'visitor')
          OR (filter_status = 'replied' AND NOT t.closed AND latest.sender = 'team')
        )
        AND (
          filter_assignment = 'all'
          OR (filter_assignment = 'mine' AND ownership.owner_id = viewer)
          OR (filter_assignment = 'unassigned' AND ownership.owner_id IS NULL)
        )
        AND (
          after_updated_at IS NULL
          OR (queue.position_at = after_updated_at AND t.id > after_chat_id)
          OR (filter_status = 'waiting' AND queue.position_at > after_updated_at)
          OR (filter_status <> 'waiting' AND queue.position_at < after_updated_at)
        )
      ORDER BY
        CASE WHEN filter_status = 'waiting' THEN queue.position_at END ASC,
        CASE WHEN filter_status <> 'waiting' THEN queue.position_at END DESC,
        t.id ASC
      LIMIT 26
    ) inbox
  ), '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.care_chat_inbox_page(text, timestamptz, text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.care_chat_inbox_page(text, timestamptz, text, text, boolean) TO authenticated;

-- Older clients page by updated_at, so preserve their ordering during rollout.
CREATE OR REPLACE FUNCTION public.care_chat_inbox_page(filter_status text, after_updated_at timestamptz, after_chat_id text, filter_assignment text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT public.care_chat_inbox_page(filter_status, after_updated_at, after_chat_id, filter_assignment, false);
$$;
