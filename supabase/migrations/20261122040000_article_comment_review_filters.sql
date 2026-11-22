CREATE FUNCTION public.list_article_comment_review_history(
  before_id bigint, decision_action text, article_query text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  search_title text := NULLIF(btrim(article_query), '');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_active)
     OR NOT COALESCE(has_role(auth.uid(), 'admin'), false) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  IF decision_action NOT IN ('dismissed', 'removed') OR char_length(search_title) > 120 THEN
    RAISE EXCEPTION 'Invalid review history filter' USING ERRCODE = '22023';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(page) ORDER BY id DESC) FROM (
      SELECT id, article_title, moderator_name, action, report_count, reviewed_at, note
      FROM article_comment_review_history
      WHERE (before_id IS NULL OR id < before_id)
        AND (decision_action IS NULL OR action = decision_action)
        AND (search_title IS NULL OR strpos(lower(article_title), lower(search_title)) > 0)
      ORDER BY id DESC
      LIMIT 51
    ) page
  ), '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.list_article_comment_review_history(bigint, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_article_comment_review_history(bigint, text, text) TO authenticated;

-- Retain the unfiltered signature for older clients.
CREATE OR REPLACE FUNCTION public.list_article_comment_review_history(before_id bigint DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT public.list_article_comment_review_history(before_id, NULL::text, NULL::text);
$$;
