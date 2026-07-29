-- 1Vet Migration Phase 12: Pet Health Insurance and Subscription Plans

-- 1. Create hmo_plans Table
CREATE TABLE IF NOT EXISTS public.hmo_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price DECIMAL(10,2) NOT NULL,
  annual_price DECIMAL(10,2) NOT NULL,
  consultations_covered_per_year INTEGER NOT NULL DEFAULT 4,
  vaccines_covered_per_year INTEGER NOT NULL DEFAULT 2,
  grooming_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  pharmacy_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  annual_coverage_cap DECIMAL(10,2) NOT NULL DEFAULT 500000.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Seed Default HMO Plans
INSERT INTO public.hmo_plans (code, name, description, monthly_price, annual_price, consultations_covered_per_year, vaccines_covered_per_year, grooming_discount_percent, pharmacy_discount_percent, annual_coverage_cap)
VALUES
  ('BASIC_WELLNESS', 'Basic Pet Wellness Plan', 'Essential coverage for routine checkups, 4 video consults, and vaccine discounts.', 5000.00, 50000.00, 4, 2, 10.00, 5.00, 250000.00),
  ('COMPREHENSIVE_CARE', 'Comprehensive HMO Plan', 'Full HMO coverage including 12 teleconsults, clinic visits, vaccines, and diagnostic labs.', 12000.00, 120000.00, 12, 4, 15.00, 10.00, 600000.00),
  ('PREMIUM_HMO', 'Premium Pet Insurance HMO', 'Unlimited teleconsults, emergency care coverage, full vaccinations, and zero co-pay lab tests.', 25000.00, 250000.00, 999, 6, 20.00, 15.00, 1500000.00)
ON CONFLICT (code) DO NOTHING;

-- 2. Create pet_hmo_subscriptions Table
CREATE TABLE IF NOT EXISTS public.pet_hmo_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_reference TEXT UNIQUE NOT NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.hmo_plans(id) ON DELETE RESTRICT NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create hmo_claims Table
CREATE TABLE IF NOT EXISTS public.hmo_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_number TEXT UNIQUE NOT NULL,
  subscription_id UUID REFERENCES public.pet_hmo_subscriptions(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  service_type TEXT NOT NULL,
  claimed_amount DECIMAL(10,2) NOT NULL,
  approved_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'settled')),
  adjudication_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Trigger for updated_at
CREATE TRIGGER update_hmo_claims_updated_at BEFORE UPDATE ON public.hmo_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE public.hmo_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_hmo_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hmo_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view active HMO plans" ON public.hmo_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Pet owners and admins can view subscriptions" ON public.pet_hmo_subscriptions
  FOR SELECT USING (
    owner_id = public.get_profile_id(auth.uid()) OR public.has_pet_access(auth.uid(), pet_id) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Pet owners and admins can create subscriptions" ON public.pet_hmo_subscriptions
  FOR INSERT WITH CHECK (
    owner_id = public.get_profile_id(auth.uid())
  );

CREATE POLICY "Participants can view HMO claims" ON public.hmo_claims
  FOR SELECT USING (
    public.is_provider_member(auth.uid(), provider_id) OR public.has_role(auth.uid(), 'admin') OR EXISTS (
      SELECT 1 FROM public.pet_hmo_subscriptions sub WHERE sub.id = hmo_claims.subscription_id AND sub.owner_id = public.get_profile_id(auth.uid())
    )
  );

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_pet_id ON public.pet_hmo_subscriptions(pet_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_owner_id ON public.pet_hmo_subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_hmo_claims_sub_id ON public.hmo_claims(subscription_id);
