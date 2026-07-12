-- Update handle_new_user to restrict role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    requested_role public.app_role;
BEGIN
    -- Determine the role, but restrict it to only 'pet_owner' or 'service_provider'
    requested_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'pet_owner');

    IF requested_role NOT IN ('pet_owner', 'service_provider') THEN
        requested_role := 'pet_owner';
    END IF;

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
    VALUES (NEW.id, requested_role);

    RETURN NEW;
END;
$$;

-- Add grant_role function for admins
CREATE OR REPLACE FUNCTION public.grant_role(target_user_id UUID, new_role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the caller is an admin
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Only admins can grant roles';
    END IF;

    -- Update or insert the role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, new_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- If we want to ensure only one role per user (as the current app logic seems to imply by using .single())
    -- we might want to delete other roles, but that depends on if we support multi-role.
    -- The current logic in AuthProvider uses .single() on user_roles, so it expects one role.
    DELETE FROM public.user_roles WHERE user_id = target_user_id AND role != new_role;
END;
$$;
