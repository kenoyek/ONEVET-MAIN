-- Create a public-safe view for profiles
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
    id,
    user_id,
    first_name,
    last_name,
    avatar_url,
    bio,
    specialty,
    business_name,
    is_available,
    license_verified,
    vendor_type,
    customer_type,
    location,
    created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Update RLS for profiles table to restrict PII
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Users can view their own profile or admins can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
