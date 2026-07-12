-- Set kenoyek@gmail.com as an admin
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user_id from the profiles table
  SELECT user_id INTO target_user_id FROM public.profiles WHERE email = 'kenoyek@gmail.com';

  IF target_user_id IS NOT NULL THEN
    -- Update existing role to admin or insert if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Ensure any other roles are replaced by admin for this user (since the app uses .single())
    DELETE FROM public.user_roles WHERE user_id = target_user_id AND role != 'admin';

    -- Update profile to ensure license_verified is true (useful if they were a provider)
    UPDATE public.profiles SET license_verified = true WHERE user_id = target_user_id;

    RAISE NOTICE 'User kenoyek@gmail.com has been promoted to admin.';
  ELSE
    RAISE NOTICE 'User kenoyek@gmail.com not found in profiles table.';
  END IF;
END $$;
