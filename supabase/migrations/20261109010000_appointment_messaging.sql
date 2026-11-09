BEGIN;
CREATE TABLE public.provider_booking_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid NOT NULL REFERENCES public.provider_booking_requests(id),
 ordinal bigint NOT NULL CHECK (ordinal>0), sender_id uuid NOT NULL REFERENCES auth.users(id),
 sender_name text NOT NULL, sender_role text NOT NULL CHECK (sender_role IN ('customer','provider_team')),
 body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000 AND body ~ '[^[:space:]]'),
 client_nonce uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(booking_id,ordinal), UNIQUE(sender_id,client_nonce)
);
CREATE INDEX booking_messages_sender_rate_idx ON public.provider_booking_messages(sender_id,created_at);
CREATE TABLE public.provider_booking_thread_reads (
 booking_id uuid NOT NULL REFERENCES public.provider_booking_requests(id), user_id uuid NOT NULL REFERENCES auth.users(id),
 last_read_ordinal bigint NOT NULL DEFAULT 0 CHECK (last_read_ordinal>=0), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(booking_id,user_id)
);
ALTER TABLE public.notifications
 ADD COLUMN booking_message_id uuid REFERENCES public.provider_booking_messages(id) ON DELETE CASCADE,
 ADD COLUMN booking_message_ordinal bigint,
 ADD CONSTRAINT notification_message_context CHECK (
  (booking_message_id IS NULL AND booking_message_ordinal IS NULL) OR
  (booking_message_id IS NOT NULL AND booking_message_ordinal IS NOT NULL AND booking_message_ordinal>0 AND booking_id IS NOT NULL)
 );
DROP INDEX public.notifications_booking_event_unique;
CREATE UNIQUE INDEX notifications_booking_event_unique ON public.notifications(user_id,booking_id,booking_version) WHERE booking_id IS NOT NULL AND booking_message_id IS NULL;
CREATE UNIQUE INDEX notifications_booking_message_unique ON public.notifications(user_id,booking_message_id) WHERE booking_message_id IS NOT NULL;
-- Keep the status trigger's conflict target aligned with the narrower event-only index.
CREATE OR REPLACE FUNCTION public.notify_provider_booking_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE booking public.provider_booking_requests; recipient uuid; heading text; body text; when_text text;
BEGIN
 SELECT * INTO booking FROM public.provider_booking_requests WHERE id=NEW.booking_id;
 IF NOT FOUND OR booking.version<>NEW.version OR booking.status<>NEW.status THEN RAISE EXCEPTION 'Booking alert must match the current event' USING ERRCODE='23514'; END IF;
 -- The replacement confirmation or original status event already explains these linked changes.
 IF NEW.event_kind<>'status_changed' THEN RETURN NEW; END IF;
 when_text:=to_char(booking.start_at AT TIME ZONE 'Africa/Lagos','DD Mon YYYY HH24:MI')||' WAT';
 heading:=CASE NEW.status
  WHEN 'pending' THEN CASE WHEN booking.replacement_for IS NULL THEN 'New booking request' ELSE 'Reschedule requested' END
  WHEN 'confirmed' THEN CASE WHEN booking.replacement_for IS NULL THEN 'Booking confirmed' ELSE 'Reschedule confirmed' END
  WHEN 'declined' THEN CASE WHEN booking.replacement_for IS NULL THEN 'Booking request declined' ELSE 'Reschedule request declined' END
  WHEN 'cancelled' THEN CASE WHEN booking.replacement_for IS NULL THEN 'Booking cancelled' ELSE 'Reschedule request cancelled' END
  WHEN 'completed' THEN 'Appointment completed'
 END;
 IF heading IS NULL THEN RAISE EXCEPTION 'Unsupported booking alert status'; END IF;
 body:=CASE WHEN NEW.status='pending' AND booking.replacement_for IS NOT NULL THEN 'A different time was requested for '||when_text||'. The original appointment stays confirmed until you accept the replacement.'
  WHEN NEW.status='confirmed' AND booking.replacement_for IS NOT NULL THEN 'The replacement appointment for '||when_text||' is confirmed. It replaces the original booking.'
  WHEN booking.replacement_for IS NOT NULL AND NEW.status IN ('declined','cancelled') THEN 'The alternative for '||when_text||' was '||NEW.status||'. Review the original appointment for its current status.'
  ELSE 'Appointment for '||when_text||': '||NEW.status||'. Open the request for current details.' END;
 FOREACH recipient IN ARRAY ARRAY(
  SELECT DISTINCT recipients.user_id FROM (
   SELECT booking.provider_owner_id AS user_id
   UNION ALL SELECT booking.customer_id WHERE NEW.status<>'pending'
   UNION ALL SELECT m.user_id FROM public.provider_members m JOIN public.profiles p ON p.user_id=m.user_id AND p.is_active WHERE m.provider_id=booking.provider_id AND m.status='active' AND m.member_role IN ('manager','staff') AND EXISTS(SELECT 1 FROM public.profiles owner_profile WHERE owner_profile.user_id=booking.provider_owner_id AND owner_profile.is_active) AND EXISTS(SELECT 1 FROM public.provider_members owner_member WHERE owner_member.provider_id=booking.provider_id AND owner_member.user_id=booking.provider_owner_id AND owner_member.member_role='owner' AND owner_member.status='active')
  ) recipients
 ) LOOP
  IF recipient IS DISTINCT FROM NEW.actor_id THEN
   INSERT INTO public.notifications(user_id,title,message,type,link,booking_id,booking_version)
   VALUES(recipient,heading,body,CASE WHEN NEW.status IN ('declined','cancelled') THEN 'warning' WHEN NEW.status IN ('confirmed','completed') THEN 'success' ELSE 'info' END,'/appointments/'||booking.id,booking.id,NEW.version)
   ON CONFLICT(user_id,booking_id,booking_version) WHERE booking_id IS NOT NULL AND booking_message_id IS NULL DO NOTHING;
  END IF;
 END LOOP;
 RETURN NEW;
END $$;

CREATE FUNCTION public.can_read_booking_thread(booking_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.provider_booking_requests b JOIN public.profiles p ON p.user_id=auth.uid() AND p.is_active WHERE b.id=booking_uuid AND (b.customer_id=auth.uid() OR public.has_provider_team_access(b.provider_id,'bookings') OR public.is_provider_reviewer()))
$$;
CREATE FUNCTION public.can_send_booking_message(booking_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(
  SELECT 1 FROM public.provider_booking_requests b JOIN public.provider_organizations o ON o.id=b.provider_id AND o.status<>'suspended'
  JOIN public.profiles own ON own.user_id=o.created_by AND own.is_active
  JOIN public.provider_members m ON m.provider_id=o.id AND m.user_id=o.created_by AND m.member_role='owner' AND m.status='active'
  JOIN public.profiles p ON p.user_id=auth.uid() AND p.is_active
  WHERE b.id=booking_uuid AND (b.customer_id=auth.uid() OR public.has_provider_team_access(b.provider_id,'bookings'))
  AND ((b.status='pending' AND b.start_at>now()) OR (b.status IN ('confirmed','completed') AND now()<=b.end_at+interval '30 days'))
 )
$$;
REVOKE ALL ON FUNCTION public.can_read_booking_thread(uuid),public.can_send_booking_message(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_booking_thread(uuid),public.can_send_booking_message(uuid) TO authenticated;
ALTER TABLE public.provider_booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_booking_thread_reads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.provider_booking_messages,public.provider_booking_thread_reads FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.provider_booking_messages,public.provider_booking_thread_reads TO authenticated;
GRANT ALL ON public.provider_booking_messages,public.provider_booking_thread_reads TO service_role;
CREATE POLICY booking_thread_participant_read ON public.provider_booking_messages FOR SELECT TO authenticated USING(public.can_read_booking_thread(booking_id));
CREATE POLICY booking_thread_own_cursor_read ON public.provider_booking_thread_reads FOR SELECT TO authenticated USING(user_id=auth.uid() AND public.can_read_booking_thread(booking_id));

CREATE FUNCTION public.send_booking_message(booking_uuid uuid, message_text text, client_nonce uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); b public.provider_booking_requests; provider_uuid uuid; prior public.provider_booking_messages; target uuid; next_ordinal bigint; author text; author_role text; recipient uuid; normalized text:=regexp_replace(message_text,'^[[:space:]]+|[[:space:]]+$','','g');
BEGIN
 -- Consistent profile -> organization lock order also serializes per-account rate checks.
 SELECT btrim(coalesce(first_name,'')||' '||coalesce(last_name,'')) INTO author FROM public.profiles WHERE user_id=actor AND is_active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active participant account required' USING ERRCODE='42501'; END IF;
 SELECT provider_id INTO provider_uuid FROM public.provider_booking_requests WHERE id=booking_uuid;
 PERFORM 1 FROM public.provider_organizations WHERE id=provider_uuid FOR UPDATE;
 SELECT * INTO b FROM public.provider_booking_requests WHERE id=booking_uuid FOR UPDATE;
 IF NOT FOUND OR NOT (b.customer_id=actor OR public.has_provider_team_access(b.provider_id,'bookings')) THEN RAISE EXCEPTION 'Conversation unavailable' USING ERRCODE='42501'; END IF;
 IF client_nonce IS NULL OR normalized IS NULL OR length(normalized) NOT BETWEEN 1 AND 2000 OR normalized !~ '[^[:space:]]' THEN RAISE EXCEPTION 'Write a message of 1–2000 characters' USING ERRCODE='22023'; END IF;
 SELECT * INTO prior FROM public.provider_booking_messages m WHERE m.sender_id=actor AND m.client_nonce=send_booking_message.client_nonce;
 IF FOUND THEN
  IF prior.booking_id=booking_uuid AND prior.body=normalized THEN RETURN prior.id; END IF;
  RAISE EXCEPTION 'Message key already used for different content' USING ERRCODE='22023';
 END IF;
 IF NOT public.can_send_booking_message(booking_uuid) THEN RAISE EXCEPTION 'Conversation is read-only' USING ERRCODE='42501'; END IF;
 IF (SELECT count(*) FROM public.provider_booking_messages WHERE sender_id=actor AND created_at>now()-interval '1 minute')>=10 OR (SELECT count(*) FROM public.provider_booking_messages WHERE sender_id=actor AND created_at>now()-interval '1 day')>=200 THEN RAISE EXCEPTION 'Message rate limit reached; try later' USING ERRCODE='23514'; END IF;
 SELECT coalesce(max(ordinal),0)+1 INTO next_ordinal FROM public.provider_booking_messages WHERE booking_id=booking_uuid;
 author_role:=CASE WHEN b.customer_id=actor THEN 'customer' ELSE 'provider_team' END;
 INSERT INTO public.provider_booking_messages(booking_id,ordinal,sender_id,sender_name,sender_role,body,client_nonce)
 VALUES(booking_uuid,next_ordinal,actor,coalesce(nullif(author,''),CASE WHEN author_role='customer' THEN 'Customer' ELSE 'Provider team' END),author_role,normalized,client_nonce) RETURNING id INTO target;
 INSERT INTO public.audit_logs(user_id,action,entity_type,entity_id,details) VALUES(actor,'provider_booking_message_sent','provider_booking',booking_uuid,jsonb_build_object('message_id',target));
 FOR recipient IN
  SELECT DISTINCT recipients.user_id FROM (
   SELECT b.customer_id AS user_id WHERE author_role='provider_team'
   UNION ALL SELECT b.provider_owner_id WHERE author_role='customer'
   UNION ALL SELECT m.user_id FROM public.provider_members m JOIN public.profiles p ON p.user_id=m.user_id AND p.is_active WHERE author_role='customer' AND m.provider_id=b.provider_id AND m.status='active' AND m.member_role IN ('manager','staff')
  ) recipients WHERE recipients.user_id<>actor
 LOOP
  INSERT INTO public.notifications(user_id,title,message,type,link,booking_id,booking_version,booking_message_id,booking_message_ordinal)
  VALUES(recipient,'New appointment message','A participant sent a message about your appointment. Open the conversation to read it.','info','/appointments/'||b.id||'#messages',b.id,b.version,target,next_ordinal)
  ON CONFLICT(user_id,booking_message_id) WHERE booking_message_id IS NOT NULL DO NOTHING;
 END LOOP;
 RETURN target;
END $$;
CREATE FUNCTION public.get_booking_thread_state(booking_uuid uuid)
RETURNS TABLE(can_send boolean,unread_count integer,last_read_ordinal bigint,last_ordinal bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE cursor_value bigint;
BEGIN
 IF NOT public.can_read_booking_thread(booking_uuid) THEN RAISE EXCEPTION 'Conversation unavailable' USING ERRCODE='42501'; END IF;
 SELECT coalesce((SELECT r.last_read_ordinal FROM public.provider_booking_thread_reads r WHERE r.booking_id=booking_uuid AND r.user_id=auth.uid()),0) INTO cursor_value;
 RETURN QUERY SELECT public.can_send_booking_message(booking_uuid),
 (SELECT count(*)::integer FROM public.provider_booking_messages m WHERE m.booking_id=booking_uuid AND m.ordinal>cursor_value AND m.sender_id<>auth.uid()),
 cursor_value,(SELECT coalesce(max(m.ordinal),0) FROM public.provider_booking_messages m WHERE m.booking_id=booking_uuid);
END $$;
CREATE FUNCTION public.mark_booking_thread_read(booking_uuid uuid, through_ordinal bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_read_booking_thread(booking_uuid) THEN RAISE EXCEPTION 'Conversation unavailable' USING ERRCODE='42501'; END IF;
 IF through_ordinal IS NULL OR through_ordinal<0 OR (through_ordinal>0 AND NOT EXISTS(SELECT 1 FROM public.provider_booking_messages m WHERE m.booking_id=booking_uuid AND m.ordinal=through_ordinal)) THEN RAISE EXCEPTION 'Choose a message from this conversation' USING ERRCODE='22023'; END IF;
 INSERT INTO public.provider_booking_thread_reads(booking_id,user_id,last_read_ordinal) VALUES(booking_uuid,auth.uid(),through_ordinal)
 ON CONFLICT(booking_id,user_id) DO UPDATE SET last_read_ordinal=greatest(provider_booking_thread_reads.last_read_ordinal,EXCLUDED.last_read_ordinal),updated_at=now();
 UPDATE public.notifications SET is_read=true WHERE user_id=auth.uid() AND booking_id=booking_uuid AND booking_message_ordinal<=through_ordinal AND NOT is_read;
END $$;
REVOKE ALL ON FUNCTION public.send_booking_message(uuid,text,uuid),public.get_booking_thread_state(uuid),public.mark_booking_thread_read(uuid,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.send_booking_message(uuid,text,uuid),public.get_booking_thread_state(uuid),public.mark_booking_thread_read(uuid,bigint) TO authenticated;
COMMIT;
