-- Incremental Migration
-- Fix RLS policy on public.profiles to allow Admins to UPDATE and DELETE profiles.
-- Previously, the UPDATE policy on public.profiles only permitted auth.uid() = user_id,
-- which caused admin operations (like verifying/approving vet profiles or updating user status)
-- to be silently blocked by Row-Level Security in PostgreSQL.

-- 1. Update profiles UPDATE policy to include Admin role check
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON public.profiles;

CREATE POLICY "Users can update own profile or admins can update all"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
);

-- 2. Add profiles DELETE policy for Admins
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);
