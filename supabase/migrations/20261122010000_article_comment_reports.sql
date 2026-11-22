CREATE TABLE public.article_comment_reports (
  comment_id uuid NOT NULL REFERENCES public.article_comments(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam', 'abuse', 'privacy', 'other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  dismissed_at timestamptz,
  PRIMARY KEY (comment_id, reporter_id)
);
CREATE INDEX article_comment_reports_open ON public.article_comment_reports (comment_id) WHERE dismissed_at IS NULL;
ALTER TABLE public.article_comment_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.article_comment_reports FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.report_article_comment(target_comment uuid, report_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_active
  ) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  PERFORM 1 FROM article_comments c
  JOIN articles a ON a.id = c.article_id
  WHERE c.id = target_comment AND c.user_id <> auth.uid() AND a.is_published
  FOR UPDATE OF c;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment unavailable' USING ERRCODE = '42501';
  END IF;

  INSERT INTO article_comment_reports (comment_id, reporter_id, reason)
  VALUES (target_comment, auth.uid(), report_reason)
  ON CONFLICT (comment_id, reporter_id) DO NOTHING;
END $$;

CREATE FUNCTION public.list_article_comment_reports()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_active)
     OR NOT COALESCE(has_role(auth.uid(), 'admin'), false) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(queue) ORDER BY queue.first_report, queue.comment_id)
    FROM (
      SELECT c.id AS comment_id, c.article_id, c.author_name, c.body, a.title AS article_title,
             count(*) AS report_count, array_agg(DISTINCT r.reason ORDER BY r.reason) AS reasons,
             min(r.created_at) AS first_report
      FROM article_comment_reports r
      JOIN article_comments c ON c.id = r.comment_id
      JOIN articles a ON a.id = c.article_id
      WHERE r.dismissed_at IS NULL
      GROUP BY c.id, a.title
      ORDER BY first_report, c.id
      LIMIT 50
    ) queue
  ), '[]'::jsonb);
END $$;

CREATE FUNCTION public.resolve_article_comment_reports(target_comment uuid, remove_comment boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_active)
     OR NOT COALESCE(has_role(auth.uid(), 'admin'), false) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  IF remove_comment IS NULL THEN
    RAISE EXCEPTION 'Resolution required' USING ERRCODE = '22023';
  END IF;
  PERFORM 1 FROM article_comments WHERE id = target_comment FOR UPDATE;
  IF remove_comment THEN
    DELETE FROM article_comments WHERE id = target_comment
      AND EXISTS (SELECT 1 FROM article_comment_reports WHERE comment_id = target_comment AND dismissed_at IS NULL);
  ELSE
    UPDATE article_comment_reports SET dismissed_at = now()
    WHERE comment_id = target_comment AND dismissed_at IS NULL;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.report_article_comment(uuid,text), public.list_article_comment_reports(),
  public.resolve_article_comment_reports(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_article_comment(uuid,text), public.list_article_comment_reports(),
  public.resolve_article_comment_reports(uuid,boolean) TO authenticated;
