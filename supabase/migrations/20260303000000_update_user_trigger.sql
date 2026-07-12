-- Update handle_new_user to include analytics fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    first_name,
    last_name,
    customer_type,
    vendor_type,
    country,
    state,
    city,
    email_verified
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'customer_type',
    NEW.raw_user_meta_data->>'vendor_type',
    COALESCE(NEW.raw_user_meta_data->>'country', 'Nigeria'),
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'city',
    COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false)
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'pet_owner'));

  RETURN NEW;
END;
$$;
