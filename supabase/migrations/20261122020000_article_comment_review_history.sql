CREATE TABLE public.article_comment_review_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  comment_id uuid NOT NULL,
  article_id uuid NOT NULL,
  article_title text NOT NULL,
  moderator_id uuid NOT NULL,
  moderator_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('dismissed', 'removed')),
  report_count bigint NOT NULL CHECK (report_count > 0),
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.article_comment_review_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.article_comment_review_history FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.resolve_article_comment_reports(target_comment uuid, remove_comment boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  moderator text;
  target_article uuid;
  target_title text;
  open_reports bigint;
BEGIN
  SELECT COALESCE(NULLIF(btrim(concat_ws(' ', first_name, last_name)), ''), 'Administrator')
  INTO moderator FROM profiles WHERE user_id = auth.uid() AND is_active;
  IF NOT FOUND OR NOT COALESCE(has_role(auth.uid(), 'admin'), false) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  IF remove_comment IS NULL THEN
    RAISE EXCEPTION 'Resolution required' USING ERRCODE = '22023';
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
    comment_id, article_id, article_title, moderator_id, moderator_name, action, report_count
  ) VALUES (
    target_comment, target_article, target_title, auth.uid(), moderator,
    CASE WHEN remove_comment THEN 'removed' ELSE 'dismissed' END, open_reports
  );
END $$;

CREATE FUNCTION public.list_article_comment_review_history(before_id bigint DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_active)
     OR NOT COALESCE(has_role(auth.uid(), 'admin'), false) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(page) ORDER BY id DESC) FROM (
      SELECT id, article_title, moderator_name, action, report_count, reviewed_at
      FROM article_comment_review_history
      WHERE before_id IS NULL OR id < before_id
      ORDER BY id DESC
      LIMIT 51
    ) page
  ), '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.list_article_comment_review_history(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_article_comment_review_history(bigint) TO authenticated;
