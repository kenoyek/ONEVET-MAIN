ALTER TABLE public.article_comment_review_history
  ADD COLUMN note text CHECK (char_length(note) BETWEEN 1 AND 500);

CREATE FUNCTION public.resolve_article_comment_reports(target_comment uuid, remove_comment boolean, decision_note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  moderator text;
  target_article uuid;
  target_title text;
  open_reports bigint;
  normalized_note text := NULLIF(btrim(decision_note, E' \t\n\r'), '');
BEGIN
  SELECT COALESCE(NULLIF(btrim(concat_ws(' ', first_name, last_name)), ''), 'Administrator')
  INTO moderator FROM profiles WHERE user_id = auth.uid() AND is_active;
  IF NOT FOUND OR NOT COALESCE(has_role(auth.uid(), 'admin'), false) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  IF remove_comment IS NULL THEN
    RAISE EXCEPTION 'Resolution required' USING ERRCODE = '22023';
  END IF;

  IF char_length(normalized_note) > 500 THEN
    RAISE EXCEPTION 'Decision note must be at most 500 characters' USING ERRCODE = '22023';
  END IF;

  SELECT c.article_id, a.title INTO target_article, target_title
  FROM article_comments c JOIN articles a ON a.id = c.article_id
  WHERE c.id = target_comment FOR UPDATE OF c;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT count(*) INTO open_reports FROM article_comment_reports
  WHERE comment_id = target_comment AND dismissed_at IS NULL;
  IF open_reports = 0 THEN RETURN; END IF;

  IF remove_comment THEN
    DELETE FROM article_comments WHERE id = target_comment;
  ELSE
    UPDATE article_comment_reports SET dismissed_at = now()
    WHERE comment_id = target_comment AND dismissed_at IS NULL;
  END IF;

  INSERT INTO article_comment_review_history (
    comment_id, article_id, article_title, moderator_id, moderator_name, action, report_count, note
  ) VALUES (
    target_comment, target_article, target_title, auth.uid(), moderator,
    CASE WHEN remove_comment THEN 'removed' ELSE 'dismissed' END, open_reports, normalized_note
  );
END $$;

REVOKE ALL ON FUNCTION public.resolve_article_comment_reports(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_article_comment_reports(uuid, boolean, text) TO authenticated;

-- Preserve the prior signature for frontends still running during the rollout.
CREATE OR REPLACE FUNCTION public.resolve_article_comment_reports(target_comment uuid, remove_comment boolean)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT public.resolve_article_comment_reports(target_comment, remove_comment, NULL::text);
$$;

CREATE OR REPLACE FUNCTION public.list_article_comment_review_history(before_id bigint DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_active)
     OR NOT COALESCE(has_role(auth.uid(), 'admin'), false) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(page) ORDER BY id DESC) FROM (
      SELECT id, article_title, moderator_name, action, report_count, reviewed_at, note
      FROM article_comment_review_history
      WHERE before_id IS NULL OR id < before_id
      ORDER BY id DESC
      LIMIT 51
    ) page
  ), '[]'::jsonb);
END $$;
