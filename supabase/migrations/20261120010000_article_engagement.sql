-- Public aggregate engagement; private voter identities and controlled writes.
CREATE TABLE public.article_likes (
 article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 PRIMARY KEY(article_id,user_id)
);
CREATE TABLE public.article_comments (
 id uuid PRIMARY KEY,
 ordinal bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 author_name text NOT NULL,
 body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 1000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX article_comments_page ON public.article_comments(article_id,ordinal DESC);
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.article_likes, public.article_comments FROM anon, authenticated;

CREATE FUNCTION public.get_article_engagement(article_uuid uuid, before_ordinal bigint DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM articles WHERE id=article_uuid AND is_published) THEN RAISE EXCEPTION 'Article unavailable' USING ERRCODE='42501'; END IF;
 SELECT jsonb_build_object(
  'likes',(SELECT count(*) FROM article_likes WHERE article_id=article_uuid),
  'liked',EXISTS(SELECT 1 FROM article_likes WHERE article_id=article_uuid AND user_id=auth.uid()),
  'comment_count',(SELECT count(*) FROM article_comments WHERE article_id=article_uuid),
  'has_older',(SELECT count(*)>20 FROM (SELECT 1 FROM article_comments WHERE article_id=article_uuid AND (before_ordinal IS NULL OR ordinal<before_ordinal) ORDER BY ordinal DESC LIMIT 21) more),
  'comments',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',id,'ordinal',ordinal,'author_name',author_name,'body',body,'created_at',created_at,'mine',user_id=auth.uid()) ORDER BY ordinal DESC) FROM (SELECT * FROM article_comments WHERE article_id=article_uuid AND (before_ordinal IS NULL OR ordinal<before_ordinal) ORDER BY ordinal DESC LIMIT 20) page),'[]'::jsonb)
 ) INTO result;
 RETURN result;
END $$;

CREATE FUNCTION public.set_article_like(article_uuid uuid, liked boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM profiles WHERE user_id=auth.uid() AND is_active) OR NOT EXISTS(SELECT 1 FROM articles WHERE id=article_uuid AND is_published) THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501'; END IF;
 IF liked IS NULL THEN RAISE EXCEPTION 'Like state required' USING ERRCODE='22023'; END IF;
 IF liked THEN INSERT INTO article_likes VALUES(article_uuid,auth.uid()) ON CONFLICT DO NOTHING;
 ELSE DELETE FROM article_likes WHERE article_id=article_uuid AND user_id=auth.uid(); END IF;
END $$;

CREATE FUNCTION public.add_article_comment(article_uuid uuid, comment_id uuid, comment_body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE display_name text; existing article_comments;
BEGIN
 SELECT btrim(concat_ws(' ',nullif(btrim(first_name),''),nullif(btrim(last_name),''))) INTO display_name FROM profiles WHERE user_id=auth.uid() AND is_active;
 IF auth.uid() IS NULL OR display_name IS NULL OR NOT EXISTS(SELECT 1 FROM articles WHERE id=article_uuid AND is_published) THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501'; END IF;
 IF comment_id IS NULL OR comment_body IS NULL OR char_length(btrim(comment_body)) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Comment must contain 1–1000 characters' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,583));
 SELECT * INTO existing FROM article_comments WHERE id=comment_id;
 IF FOUND THEN
  IF existing.user_id=auth.uid() AND existing.article_id=article_uuid AND existing.body=btrim(comment_body) THEN RETURN existing.id; END IF;
  RAISE EXCEPTION 'Comment retry conflict' USING ERRCODE='22023';
 END IF;
 IF (SELECT count(*) FROM article_comments WHERE user_id=auth.uid() AND created_at>now()-interval '1 minute')>=5 THEN RAISE EXCEPTION 'Please wait before commenting again' USING ERRCODE='23514'; END IF;
 INSERT INTO article_comments(id,article_id,user_id,author_name,body) VALUES(comment_id,article_uuid,auth.uid(),COALESCE(nullif(display_name,''),'1Vet reader'),btrim(comment_body));
 RETURN comment_id;
END $$;

CREATE FUNCTION public.remove_article_comment(article_uuid uuid, comment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM profiles WHERE user_id=auth.uid() AND is_active) THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501'; END IF;
 DELETE FROM article_comments WHERE id=comment_id AND article_id=article_uuid AND (user_id=auth.uid() OR has_role(auth.uid(),'admin'));
END $$;
REVOKE ALL ON FUNCTION public.get_article_engagement(uuid,bigint), public.set_article_like(uuid,boolean), public.add_article_comment(uuid,uuid,text), public.remove_article_comment(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_article_engagement(uuid,bigint) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_article_like(uuid,boolean), public.add_article_comment(uuid,uuid,text), public.remove_article_comment(uuid,uuid) TO authenticated;
