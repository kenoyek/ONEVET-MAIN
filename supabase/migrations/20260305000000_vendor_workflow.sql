-- Create vendor status enum
DO $$ BEGIN
    CREATE TYPE public.vendor_status AS ENUM ('pending', 'approved', 'rejected', 'suspended', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add verification_status to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verification_status vendor_status DEFAULT 'pending';

-- Map existing license_verified to verification_status
UPDATE public.profiles
SET verification_status = CASE
    WHEN license_verified = true THEN 'approved'::vendor_status
    WHEN license_number IS NOT NULL THEN 'pending'::vendor_status
    ELSE 'inactive'::vendor_status
END
WHERE verification_status = 'pending';

-- Update audit_logs table to ensure it's robust
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs
CREATE POLICY "Anyone can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);
