CREATE TABLE public.care_chat_availability (
  staff_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_until timestamptz NOT NULL
);
ALTER TABLE public.care_chat_availability ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.care_chat_availability FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.care_chat_is_available()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM care_chat_availability a
    JOIN profiles p ON p.user_id = a.staff_id
    WHERE a.available_until > now() AND p.is_active AND has_role(a.staff_id, 'admin')
  );
$$;

CREATE FUNCTION public.care_chat_staff_availability(accepting boolean DEFAULT NULL)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  expiry timestamptz;
BEGIN
  PERFORM care_chat_assert_staff();

  IF accepting IS TRUE THEN
    INSERT INTO care_chat_availability AS a (staff_id, available_until)
    VALUES (auth.uid(), now() + interval '30 minutes')
    ON CONFLICT (staff_id) DO UPDATE SET available_until = excluded.available_until
    RETURNING a.available_until INTO expiry;
  ELSIF accepting IS FALSE THEN
    DELETE FROM care_chat_availability WHERE staff_id = auth.uid();
  ELSE
    SELECT available_until INTO expiry FROM care_chat_availability
    WHERE staff_id = auth.uid() AND available_until > now();
  END IF;

  RETURN expiry;
END $$;

REVOKE ALL ON FUNCTION public.care_chat_is_available(), public.care_chat_staff_availability(boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.care_chat_is_available() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.care_chat_staff_availability(boolean) TO authenticated;
