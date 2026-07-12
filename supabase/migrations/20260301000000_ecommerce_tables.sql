-- Add stock_quantity to marketplace_listings
ALTER TABLE public.marketplace_listings
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 10;

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.profiles(id) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
    payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
    payment_reference TEXT,
    shipping_address TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.marketplace_listings(id) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) NOT NULL
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies for orders
DO $$ BEGIN
    CREATE POLICY "Users can view their own orders" ON public.orders
        FOR SELECT USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = customer_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own orders" ON public.orders
        FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = customer_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Policies for order_items
DO $$ BEGIN
    CREATE POLICY "Users can view their own order items" ON public.order_items
        FOR SELECT USING (auth.uid() IN (
            SELECT p.user_id FROM profiles p
            JOIN orders o ON o.customer_id = p.id
            WHERE o.id = order_id
        ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert order items" ON public.order_items
        FOR INSERT WITH CHECK (true); -- Usually controlled by order creation logic
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
