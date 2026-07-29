-- 1Vet Migration Phase 11: Multi-Channel Payments, Escrow and Provider Payout Engine

-- 1. Create payment_transactions Table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_reference TEXT UNIQUE NOT NULL,
  payment_gateway TEXT NOT NULL DEFAULT 'paystack',
  gateway_reference TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'pending', 'successful', 'failed', 'refunded')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create escrow_accounts Table
CREATE TABLE IF NOT EXISTS public.escrow_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_reference TEXT UNIQUE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  held_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_provider_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded', 'disputed')),
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create escrow_releases Table
CREATE TABLE IF NOT EXISTS public.escrow_releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID REFERENCES public.escrow_accounts(id) ON DELETE CASCADE NOT NULL,
  released_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_released DECIMAL(10,2) NOT NULL,
  release_reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Triggers for updated_at
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_releases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their payment transactions" ON public.payment_transactions
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Provider members and admins can view escrow accounts" ON public.escrow_accounts
  FOR SELECT USING (public.is_provider_member(auth.uid(), provider_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Provider members and admins can view escrow releases" ON public.escrow_releases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.escrow_accounts ea WHERE ea.id = escrow_releases.escrow_id AND (public.is_provider_member(auth.uid(), ea.provider_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_payment_txns_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_txns_booking_id ON public.payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_provider_id ON public.escrow_accounts(provider_id);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_booking_id ON public.escrow_accounts(booking_id);
