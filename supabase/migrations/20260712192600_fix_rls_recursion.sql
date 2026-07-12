-- Incremental Migration
-- Fix infinite recursion in RLS policies by converting helper functions from LANGUAGE sql to LANGUAGE plpgsql.
-- LANGUAGE sql functions with SECURITY DEFINER are subject to inlining and can execute under RLS of the queried tables, causing stack overflows.

-- 1. Check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- 2. Get profile ID
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
  RETURN v_id;
END;
$$;

-- 3. Is consultation participant
CREATE OR REPLACE FUNCTION public.is_consultation_participant(_consultation_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.consultations c
    JOIN public.profiles p ON (c.pet_owner_id = p.id OR c.veterinarian_id = p.id)
    WHERE c.id = _consultation_id AND p.user_id = _user_id
  );
END;
$$;

-- 4. Get unread message count
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_profile_id UUID;
BEGIN
  v_profile_id := get_profile_id(p_user_id);
  SELECT COALESCE(COUNT(*)::integer, 0) INTO v_count
  FROM messages m
  JOIN consultations c ON m.consultation_id = c.id
  WHERE m.is_read = false
  AND m.sender_id != v_profile_id
  AND (c.pet_owner_id = v_profile_id OR c.veterinarian_id = v_profile_id);
  RETURN v_count;
END;
$$;

-- 5. Get online vets count
CREATE OR REPLACE FUNCTION public.get_online_vets_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COALESCE(COUNT(*)::integer, 0) INTO v_count
  FROM profiles p
  JOIN user_roles ur ON p.user_id = ur.user_id
  WHERE ur.role = 'veterinarian'
  AND p.is_available = true
  AND p.license_verified = true;
  RETURN v_count;
END;
$$;

-- 6. Get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*)::int INTO v_count FROM public.notifications
  WHERE user_id = _user_id AND is_read = false;
  RETURN v_count;
END;
$$;

-- 7. Has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = _user_id
      AND status IN ('active', 'trial')
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$;
