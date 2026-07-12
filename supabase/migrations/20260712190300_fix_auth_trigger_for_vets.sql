-- Incremental Migration
-- Fix the handle_new_user function to allow veterinarian role and support metadata fields on signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    requested_role public.app_role;
    v_status public.vendor_status;
BEGIN
    requested_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'pet_owner');

    IF requested_role NOT IN ('pet_owner', 'service_provider', 'veterinarian') THEN
        requested_role := 'pet_owner';
    END IF;

    -- Set verification status
    IF requested_role = 'veterinarian' THEN
        v_status := 'pending';
    ELSIF requested_role = 'service_provider' THEN
        v_status := 'approved';
    ELSE
        v_status := 'inactive';
    END IF;

    INSERT INTO public.profiles (
        user_id, email, first_name, last_name, customer_type, vendor_type, country, state, city, email_verified,
        business_name, location, license_number, specialty, verification_status
    )
    VALUES (
        NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.raw_user_meta_data->>'customer_type', NEW.raw_user_meta_data->>'vendor_type',
        COALESCE(NEW.raw_user_meta_data->>'country', 'Nigeria'), NEW.raw_user_meta_data->>'state', NEW.raw_user_meta_data->>'city',
        COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false),
        NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'location', NEW.raw_user_meta_data->>'license_number',
        NEW.raw_user_meta_data->>'specialty', v_status
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, requested_role);

    RETURN NEW;
END;
$$;
