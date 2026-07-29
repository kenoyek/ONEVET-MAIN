-- 1Vet Migration Phase 18: Audit Logging, Security Hardening and Regulatory Compliance

-- 1. Create platform_audit_logs Table
CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  target_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create data_access_logs Table
CREATE TABLE IF NOT EXISTS public.data_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  accessor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  accessed_pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  access_type TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Audit logs are strictly readable by admins & appendable by system)
CREATE POLICY "Admins can view audit logs" ON public.platform_audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert audit logs" ON public.platform_audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and owners can view access logs" ON public.data_access_logs
  FOR SELECT USING (
    accessor_id = auth.uid() OR public.has_pet_access(auth.uid(), accessed_pet_id) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Authenticated users can insert access logs" ON public.data_access_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.platform_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.platform_audit_logs(target_entity, target_id);
CREATE INDEX IF NOT EXISTS idx_data_access_pet ON public.data_access_logs(accessed_pet_id);
