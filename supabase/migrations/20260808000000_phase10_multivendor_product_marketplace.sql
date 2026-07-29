-- 1Vet Migration Phase 10: Multi-Vendor Pet Product Marketplace

-- 1. Upgrade public.products Table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('draft', 'pending_review', 'approved', 'rejected'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;

-- 2. Create vendor_payouts Table
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payout_reference TEXT UNIQUE NOT NULL,
  vendor_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  bank_details JSONB,
  payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create vendor_commissions Table
CREATE TABLE IF NOT EXISTS public.vendor_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  gross_sales DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.1000,
  commission_amount DECIMAL(10,2) NOT NULL,
  net_payout DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'unsettled' CHECK (status IN ('unsettled', 'settled', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Vendor members can view vendor payouts" ON public.vendor_payouts
  FOR SELECT USING (public.is_provider_member(auth.uid(), vendor_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendor members can view vendor commissions" ON public.vendor_commissions
  FOR SELECT USING (public.is_provider_member(auth.uid(), vendor_id) OR public.has_role(auth.uid(), 'admin'));

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON public.products(approval_status);
CREATE INDEX IF NOT EXISTS idx_vendor_commissions_vendor_id ON public.vendor_commissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON public.vendor_payouts(vendor_id);
