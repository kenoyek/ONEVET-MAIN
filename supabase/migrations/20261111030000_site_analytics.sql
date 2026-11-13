-- First-party traffic measurements. No raw IP, full user agent, account ID or URL query string.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE public.site_analytics_config(id boolean PRIMARY KEY DEFAULT true CHECK(id), key_hash bytea NOT NULL, rotated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.site_analytics_events(
 id uuid PRIMARY KEY, occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 visitor_id uuid NOT NULL, session_id uuid NOT NULL,
 event_name text NOT NULL CHECK(event_name IN ('page_view','heartbeat')),
 path text NOT NULL CHECK(length(path)<=100),
 country text CHECK(country ~ '^[A-Z]{2}$'), region text, city text,
 referrer text, source text, medium text, campaign text,
 device text NOT NULL CHECK(device IN ('desktop','mobile','tablet','unknown')),
 browser text NOT NULL, os text NOT NULL, language text
);
CREATE INDEX site_analytics_time ON public.site_analytics_events(occurred_at);
CREATE INDEX site_analytics_session ON public.site_analytics_events(session_id,occurred_at);
CREATE TABLE public.site_analytics_limits(key text NOT NULL, minute timestamptz NOT NULL, hits integer NOT NULL DEFAULT 1, PRIMARY KEY(key,minute));
ALTER TABLE public.site_analytics_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_analytics_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.site_analytics_config,public.site_analytics_events,public.site_analytics_limits FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.rotate_site_analytics_key() RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE token text;
BEGIN
 IF NOT has_role(auth.uid(),'admin') OR NOT EXISTS(SELECT 1 FROM profiles WHERE user_id=auth.uid() AND is_active) THEN RAISE EXCEPTION 'Administrator required' USING ERRCODE='42501'; END IF;
 token:=encode(gen_random_bytes(32),'hex');
 INSERT INTO site_analytics_config(id,key_hash) VALUES(true,digest(token,'sha256')) ON CONFLICT(id) DO UPDATE SET key_hash=excluded.key_hash,rotated_at=clock_timestamp();
 INSERT INTO audit_logs(user_id,action,entity_type) VALUES(auth.uid(),'site_analytics_key_rotated','site_analytics');
 RETURN token;
END $$;
REVOKE ALL ON FUNCTION public.rotate_site_analytics_key() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rotate_site_analytics_key() TO authenticated;

CREATE FUNCTION public.site_analytics_collector_ready(ingest_key text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
 SELECT length(coalesce(ingest_key,''))=64 AND EXISTS(SELECT 1 FROM site_analytics_config WHERE key_hash=digest(ingest_key,'sha256'));
$$;
REVOKE ALL ON FUNCTION public.site_analytics_collector_ready(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.site_analytics_collector_ready(text) TO anon,authenticated,service_role;

CREATE FUNCTION public.record_site_visit(payload jsonb, ingest_key text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE rate_count integer; bucket text; event_uuid uuid; visitor_uuid uuid; session_uuid uuid; route text;
BEGIN
 IF length(coalesce(ingest_key,''))<>64 OR NOT EXISTS(SELECT 1 FROM site_analytics_config WHERE key_hash=digest(ingest_key,'sha256')) THEN RAISE EXCEPTION 'Collector authorization required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(payload) IS DISTINCT FROM 'object' OR octet_length(payload::text)>5000 THEN RAISE EXCEPTION 'Invalid event' USING ERRCODE='22023'; END IF;
 event_uuid:=(payload->>'id')::uuid; visitor_uuid:=(payload->>'visitor_id')::uuid; session_uuid:=(payload->>'session_id')::uuid; route:=payload->>'path';
 IF event_uuid IS NULL OR visitor_uuid IS NULL OR session_uuid IS NULL OR coalesce(payload->>'event_name','') NOT IN ('page_view','heartbeat') OR
 route IS NULL OR route NOT IN ('/','/about','/pricing','/contact','/articles','/articles/:article','/services','/pet-care','/farm-care','/urgent-care','/find-a-vet','/provider-marketplace','/provider/public/:provider','/marketplace','/marketplace/:product','/cart','/checkout','/auth','/dashboard','/vet-dashboard','/profile','/pets','/pets/new','/pets/:pet','/farms','/farms/:farm','/booking/new','/my-bookings','/appointments/:appointment','/provider/register','/provider/organization/:organization','/other') OR
 coalesce(payload->>'device','') NOT IN ('desktop','mobile','tablet','unknown') OR
 coalesce(payload->>'browser','') NOT IN ('Chrome','Edge','Firefox','Safari','Other') OR coalesce(payload->>'os','') NOT IN ('Android','iOS','Windows','macOS','Linux','Other') THEN RAISE EXCEPTION 'Invalid event fields' USING ERRCODE='22023'; END IF;
 bucket:=payload->>'abuse_key';
 IF bucket IS NULL OR bucket!~'^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid rate key' USING ERRCODE='22023'; END IF;
 -- Rate limits use an ephemeral daily HMAC, never a raw IP or event-linked address.
 INSERT INTO site_analytics_limits(key,minute) VALUES(bucket,date_trunc('minute',clock_timestamp())) ON CONFLICT(key,minute) DO UPDATE SET hits=least(site_analytics_limits.hits+1,10000) RETURNING hits INTO rate_count;
 IF rate_count>240 THEN RETURN false; END IF;
 DELETE FROM site_analytics_limits WHERE minute<clock_timestamp()-interval '15 minutes';
 DELETE FROM site_analytics_events WHERE id IN (SELECT id FROM site_analytics_events WHERE occurred_at<clock_timestamp()-interval '90 days' LIMIT 1000);
 INSERT INTO site_analytics_events(id,visitor_id,session_id,event_name,path,country,region,city,referrer,source,medium,campaign,device,browser,os,language)
 VALUES(event_uuid,visitor_uuid,session_uuid,payload->>'event_name',route,
 CASE WHEN payload->>'country' ~ '^[A-Z]{2}$' THEN payload->>'country' END,
 left(nullif(payload->>'region',''),120),left(nullif(payload->>'city',''),120),left(nullif(payload->>'referrer',''),150),
 left(nullif(payload->>'source',''),64),left(nullif(payload->>'medium',''),64),left(nullif(payload->>'campaign',''),64),
 payload->>'device',payload->>'browser',payload->>'os',left(payload->>'language',20)) ON CONFLICT(id) DO NOTHING;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.record_site_visit(jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_site_visit(jsonb,text) TO anon,authenticated,service_role;

CREATE FUNCTION public.site_analytics_report(window_days integer DEFAULT 30, country_filter text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE since_at timestamptz; previous_at timestamptz; through_at timestamptz:=clock_timestamp(); result jsonb;
BEGIN
 IF NOT has_role(auth.uid(),'admin') OR NOT EXISTS(SELECT 1 FROM profiles WHERE user_id=auth.uid() AND is_active) THEN RAISE EXCEPTION 'Administrator required' USING ERRCODE='42501'; END IF;
 IF window_days NOT IN (1,7,30,90) OR (country_filter IS NOT NULL AND country_filter !~'^[A-Z]{2}$') THEN RAISE EXCEPTION 'Invalid report filters' USING ERRCODE='22023'; END IF;
 since_at:=(((through_at AT TIME ZONE 'Africa/Lagos')::date-window_days+1)::timestamp AT TIME ZONE 'Africa/Lagos');
 previous_at:=since_at-make_interval(days=>window_days);
 WITH events AS MATERIALIZED (SELECT * FROM site_analytics_events WHERE occurred_at>=since_at AND occurred_at<=through_at AND (country_filter IS NULL OR country=country_filter)),
 pages AS MATERIALIZED (SELECT * FROM events WHERE event_name='page_view'),
 sessions AS (SELECT session_id,count(*) FILTER(WHERE event_name='page_view') views,count(*) FILTER(WHERE event_name='heartbeat') beats FROM events GROUP BY session_id),
 ordered_pages AS (SELECT *,row_number() OVER(PARTITION BY session_id ORDER BY occurred_at,id) first_n,row_number() OVER(PARTITION BY session_id ORDER BY occurred_at DESC,id DESC) last_n FROM pages)
 SELECT jsonb_build_object(
 'generated_at',through_at,'since',since_at,'days',window_days,'country_filter',country_filter,
 'configured',EXISTS(SELECT 1 FROM site_analytics_config),'last_event_at',(SELECT max(occurred_at) FROM site_analytics_events),
 'metrics',jsonb_build_object('active_browsers',(SELECT count(DISTINCT visitor_id) FROM events WHERE occurred_at>=through_at-interval '5 minutes' AND visitor_id IN (SELECT visitor_id FROM pages)),'page_views',(SELECT count(*) FROM pages),'visitors',(SELECT count(DISTINCT visitor_id) FROM pages),'sessions',(SELECT count(*) FROM sessions WHERE views>0),'engaged_sessions',(SELECT count(*) FROM sessions WHERE views>0 AND (views>=2 OR beats>=2)),'visible_seconds',(SELECT count(*)*30 FROM events WHERE event_name='heartbeat' AND session_id IN (SELECT session_id FROM pages)),'located_views',(SELECT count(*) FROM pages WHERE country IS NOT NULL),'city_views',(SELECT count(*) FROM pages WHERE city IS NOT NULL)),
 'registrations',jsonb_build_object('period',(SELECT count(*) FROM profiles WHERE created_at>=since_at),'previous',(SELECT count(*) FROM profiles WHERE created_at>=previous_at AND created_at<since_at),'total',(SELECT count(*) FROM profiles)),
 'daily',(SELECT coalesce(jsonb_agg(row_to_json(d) ORDER BY d.day),'[]') FROM (SELECT day_value::date::text AS "day",count(p.id) page_views,count(DISTINCT p.visitor_id) visitors FROM generate_series((since_at AT TIME ZONE 'Africa/Lagos')::date,(through_at AT TIME ZONE 'Africa/Lagos')::date,interval '1 day') AS series(day_value) LEFT JOIN pages p ON (p.occurred_at AT TIME ZONE 'Africa/Lagos')::date=day_value::date GROUP BY day_value) d),
 'countries',(SELECT coalesce(jsonb_agg(row_to_json(d)),'[]') FROM (SELECT coalesce(country,'Unknown') label,count(*) views,count(DISTINCT visitor_id) visitors FROM pages GROUP BY country ORDER BY count(*) DESC,coalesce(country,'Unknown') LIMIT 50) d),
 'country_options',(SELECT coalesce(jsonb_agg(country ORDER BY country),'[]') FROM (SELECT DISTINCT country FROM site_analytics_events WHERE event_name='page_view' AND occurred_at>=since_at AND country IS NOT NULL) c),
 'locations',(SELECT coalesce(jsonb_agg(row_to_json(d)),'[]') FROM (SELECT concat_ws(' / ',coalesce(country,'Unknown'),coalesce(region,'Unknown region'),coalesce(city,'Unknown city')) label,count(*) views,count(DISTINCT visitor_id) visitors FROM pages GROUP BY country,region,city ORDER BY count(*) DESC,1 LIMIT 30) d),
 'pages',(SELECT coalesce(jsonb_agg(row_to_json(d)),'[]') FROM (SELECT path label,count(*) views,count(DISTINCT visitor_id) visitors FROM pages GROUP BY path ORDER BY count(*) DESC,path LIMIT 30) d),
 'referrers',(SELECT coalesce(jsonb_agg(row_to_json(d)),'[]') FROM (SELECT coalesce(referrer,'Direct / unknown') label,count(*) views,count(DISTINCT visitor_id) visitors FROM pages GROUP BY referrer ORDER BY count(*) DESC,1 LIMIT 30) d),
 'campaigns',(SELECT coalesce(jsonb_agg(row_to_json(d)),'[]') FROM (SELECT concat_ws(' / ',coalesce(source,'No source'),coalesce(medium,'No medium'),coalesce(campaign,'No campaign')) label,count(*) views,count(DISTINCT visitor_id) visitors FROM pages WHERE source IS NOT NULL OR medium IS NOT NULL OR campaign IS NOT NULL GROUP BY source,medium,campaign ORDER BY count(*) DESC,1 LIMIT 30) d),
 'devices',(SELECT coalesce(jsonb_agg(row_to_json(d)),'[]') FROM (SELECT device label,count(*) views,count(DISTINCT visitor_id) visitors FROM pages GROUP BY device ORDER BY count(*) DESC,device) d),
 'browsers',(SELECT coalesce(jsonb_agg(row_to_json(d)),'[]') FROM (SELECT browser label,count(*) views,count(DISTINCT visitor_id) visitors FROM pages GROUP BY browser ORDER BY count(*) DESC,browser) d),
 'systems',(SELECT coalesce(jsonb_agg(row_to_json(d)),'[]') FROM (SELECT os label,count(*) views,count(DISTINCT visitor_id) visitors FROM pages GROUP BY os ORDER BY count(*) DESC,os) d),
 'languages',(SELECT coalesce(jsonb_agg(row_to_json(d)),'[]') FROM (SELECT coalesce(language,'Unknown') label,count(*) views,count(DISTINCT visitor_id) visitors FROM pages GROUP BY language ORDER BY count(*) DESC,1 LIMIT 20) d),
 'landing',(SELECT coalesce(jsonb_agg(row_to_json(d)),'[]') FROM (SELECT path label,count(*) views,count(DISTINCT visitor_id) visitors FROM ordered_pages WHERE first_n=1 GROUP BY path ORDER BY count(*) DESC,path LIMIT 20) d),
 'exit',(SELECT coalesce(jsonb_agg(row_to_json(d)),'[]') FROM (SELECT path label,count(*) views,count(DISTINCT visitor_id) visitors FROM ordered_pages WHERE last_n=1 GROUP BY path ORDER BY count(*) DESC,path LIMIT 20) d),
 'journeys',(SELECT coalesce(jsonb_agg(row_to_json(d)),'[]') FROM (SELECT path label,count(*) views,count(DISTINCT visitor_id) visitors FROM pages WHERE path IN ('/marketplace','/marketplace/:product','/cart','/auth','/booking/new') GROUP BY path ORDER BY path) d)
 ) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.site_analytics_report(integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.site_analytics_report(integer,text) TO authenticated;
