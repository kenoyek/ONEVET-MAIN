-- Add license_url column to profiles for vet license uploads
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_url text;

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    duration_months integer NOT NULL DEFAULT 1,
    price numeric NOT NULL DEFAULT 0,
    currency text NOT NULL DEFAULT 'NGN',
    is_active boolean DEFAULT true,
    features jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view active plans
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage plans
CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
    starts_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions"
ON public.subscriptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create audit_logs table for admin activity tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view and create audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Enable realtime for consultations table (messages already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'consultations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
  END IF;
END $$;

-- Create storage bucket for licenses
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('licenses', 'licenses', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for licenses bucket
CREATE POLICY "Users can upload their own license"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own license"
ON storage.objects
FOR SELECT
USING (bucket_id = 'licenses' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Users can update their own license"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own license"
ON storage.objects
FOR DELETE
USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage bucket for pet avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pet-avatars', 'pet-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for pet-avatars bucket
CREATE POLICY "Anyone can view pet avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pet-avatars');

CREATE POLICY "Authenticated users can upload pet avatars"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'pet-avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their pet avatars"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'pet-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their pet avatars"
ON storage.objects
FOR DELETE
USING (bucket_id = 'pet-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = _user_id
      AND status IN ('active', 'trial')
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Add default subscription plans
INSERT INTO public.subscription_plans (name, description, duration_months, price, currency, features)
VALUES 
  ('Monthly', 'Monthly access to 24/7 vet consultations', 1, 5000, 'NGN', '["Unlimited vet consultations", "Pet health records", "24/7 availability", "Chat history"]'::jsonb),
  ('Yearly', 'Annual access with 2 months free', 12, 50000, 'NGN', '["Unlimited vet consultations", "Pet health records", "24/7 availability", "Chat history", "Priority support", "2 months free"]'::jsonb)
ON CONFLICT DO NOTHING;