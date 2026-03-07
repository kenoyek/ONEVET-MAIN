-- Fix the permissive audit_logs INSERT policy
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;

-- More restrictive policy - only authenticated users can create audit logs
CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);