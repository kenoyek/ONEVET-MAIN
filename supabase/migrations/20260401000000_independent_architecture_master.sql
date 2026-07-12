-- 1Vet Master Schema Migration
-- Consolidates all tables, enums, functions, and RLS policies for a fresh Supabase project.

-- 0. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('pet_owner', 'veterinarian', 'service_provider', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.species_type AS ENUM ('dog', 'cat', 'bird', 'rabbit', 'fish', 'cattle', 'goat', 'sheep', 'poultry', 'pig', 'horse', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.consultation_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.service_category AS ENUM ('grooming', 'pet_sitting', 'training', 'vet_clinic', 'vet_store', 'boarding', 'transportation', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.vendor_status AS ENUM ('pending', 'approved', 'rejected', 'suspended', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Base Helper Functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Core Tables

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'pet_owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  license_number TEXT,
  license_url TEXT,
  license_verified BOOLEAN DEFAULT FALSE,
  verification_status vendor_status DEFAULT 'inactive',
  is_available BOOLEAN DEFAULT FALSE,
  specialty TEXT,
  business_name TEXT,
  business_address TEXT,
  location TEXT,
  vendor_type TEXT,
  customer_type TEXT,
  country TEXT DEFAULT 'Nigeria',
  state TEXT,
  city TEXT,
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Public Profiles View
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
    id,
    user_id,
    first_name,
    last_name,
    avatar_url,
    bio,
    specialty,
    business_name,
    is_available,
    license_verified,
    vendor_type,
    customer_type,
    location,
    created_at
FROM public.profiles;

-- Pets
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species species_type NOT NULL,
  breed TEXT,
  date_of_birth DATE,
  weight DECIMAL(10,2),
  gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
  avatar_url TEXT,
  vaccination_history JSONB DEFAULT '[]'::jsonb,
  medical_notes TEXT,
  is_livestock BOOLEAN DEFAULT FALSE,
  livestock_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Consultations
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  veterinarian_id UUID REFERENCES public.profiles(id),
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  status consultation_status DEFAULT 'pending' NOT NULL,
  chief_complaint TEXT NOT NULL,
  notes TEXT,
  diagnosis TEXT,
  prescription TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Service Listings
CREATE TABLE IF NOT EXISTS public.service_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category service_category NOT NULL,
  price DECIMAL(10,2),
  price_unit TEXT DEFAULT 'per service',
  location TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES public.service_listings(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  status booking_status DEFAULT 'pending' NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  notes TEXT,
  total_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Articles
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Marketplace Listings
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  location TEXT,
  images TEXT[] DEFAULT '{}',
  stock_quantity INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Orders
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

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.marketplace_listings(id) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) NOT NULL
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
    starts_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, success, warning, error
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Vet Presence
CREATE TABLE IF NOT EXISTS public.vet_presence (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_online boolean DEFAULT false,
  last_seen_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contact Messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- 4. Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_listings_updated_at BEFORE UPDATE ON public.service_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vet_presence_updated_at BEFORE UPDATE ON public.vet_presence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Helper RPC Functions

-- Check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get profile ID
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Is consultation participant
CREATE OR REPLACE FUNCTION public.is_consultation_participant(_consultation_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consultations c
    JOIN public.profiles p ON (c.pet_owner_id = p.id OR c.veterinarian_id = p.id)
    WHERE c.id = _consultation_id AND p.user_id = _user_id
  )
$$;

-- Get unread message count
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM messages m
  JOIN consultations c ON m.consultation_id = c.id
  WHERE m.is_read = false
  AND m.sender_id != get_profile_id(p_user_id)
  AND (c.pet_owner_id = get_profile_id(p_user_id) OR c.veterinarian_id = get_profile_id(p_user_id));
$$;

-- Get online vets count
CREATE OR REPLACE FUNCTION public.get_online_vets_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM profiles p
  JOIN user_roles ur ON p.user_id = ur.user_id
  WHERE ur.role = 'veterinarian'
  AND p.is_available = true
  AND p.license_verified = true;
$$;

-- Get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.notifications
  WHERE user_id = _user_id AND is_read = false
$$;

-- Has active subscription
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

-- Grant role (Admin only)
CREATE OR REPLACE FUNCTION public.grant_role(target_user_id UUID, new_role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Only admins can grant roles';
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, new_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    DELETE FROM public.user_roles WHERE user_id = target_user_id AND role != new_role;
END;
$$;

-- Handle subscription payment
CREATE OR REPLACE FUNCTION public.handle_subscription_payment(
    p_user_id UUID,
    p_plan_id UUID,
    p_payment_reference TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_duration_months INTEGER;
    v_expires_at TIMESTAMPTZ;
BEGIN
    SELECT duration_months INTO v_duration_months
    FROM subscription_plans
    WHERE id = p_plan_id;

    IF v_duration_months IS NULL THEN
        RAISE EXCEPTION 'Invalid plan_id';
    END IF;

    v_expires_at := NOW() + (v_duration_months || ' months')::INTERVAL;

    INSERT INTO public.subscriptions (user_id, plan_id, status, starts_at, expires_at, updated_at)
    VALUES (p_user_id, p_plan_id, 'active', NOW(), v_expires_at, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET plan_id = EXCLUDED.plan_id, status = 'active', starts_at = NOW(), expires_at = EXCLUDED.expires_at, updated_at = NOW();

    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_user_id, 'subscription_payment_verified', 'subscription', (SELECT id FROM subscriptions WHERE user_id = p_user_id), jsonb_build_object('reference', p_payment_reference, 'plan_id', p_plan_id));
END;
$$;

-- Handle order payment
CREATE OR REPLACE FUNCTION public.handle_order_payment(
    p_order_id UUID,
    p_payment_reference TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    item RECORD;
BEGIN
    UPDATE public.orders
    SET payment_status = 'paid', status = 'processing', payment_reference = p_payment_reference, updated_at = NOW()
    WHERE id = p_order_id;

    FOR item IN (SELECT product_id, quantity FROM order_items WHERE order_id = p_order_id) LOOP
        UPDATE marketplace_listings
        SET stock_quantity = stock_quantity - item.quantity
        WHERE id = item.product_id;
    END LOOP;

    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES ((SELECT profiles.user_id FROM profiles JOIN orders ON orders.customer_id = profiles.id WHERE orders.id = p_order_id),
            'order_payment_verified', 'order', p_order_id, jsonb_build_object('reference', p_payment_reference));
END;
$$;

-- Handle new user signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    requested_role public.app_role;
    v_status public.vendor_status;
BEGIN
    requested_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'pet_owner');

    IF requested_role NOT IN ('pet_owner', 'service_provider', 'veterinarian') THEN
        requested_role := 'pet_owner';
    END IF;

    -- Set verification status
    IF requested_role = 'veterinarian' THEN
        v_status := 'pending';
    ELSIF requested_role = 'service_provider' THEN
        v_status := 'approved';
    ELSE
        v_status := 'inactive';
    END IF;

    INSERT INTO public.profiles (
        user_id, email, first_name, last_name, customer_type, vendor_type, country, state, city, email_verified,
        business_name, location, license_number, specialty, verification_status
    )
    VALUES (
        NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.raw_user_meta_data->>'customer_type', NEW.raw_user_meta_data->>'vendor_type',
        COALESCE(NEW.raw_user_meta_data->>'country', 'Nigeria'), NEW.raw_user_meta_data->>'state', NEW.raw_user_meta_data->>'city',
        COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false),
        NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'location', NEW.raw_user_meta_data->>'license_number',
        NEW.raw_user_meta_data->>'specialty', v_status
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, requested_role);

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Row Level Security Policies

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Policies for profiles
GRANT SELECT ON public.public_profiles TO anon, authenticated;
CREATE POLICY "Users can view their own profile or admins can view all" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Policies for pets
CREATE POLICY "Owners and Vets can view pets" ON public.pets FOR SELECT USING (owner_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'veterinarian'));
CREATE POLICY "Owners can manage pets" ON public.pets FOR ALL USING (owner_id = public.get_profile_id(auth.uid()));

-- Policies for consultations
CREATE POLICY "Participants and Admins can view consultations" ON public.consultations FOR SELECT USING (pet_owner_id = public.get_profile_id(auth.uid()) OR veterinarian_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Pet owners can create consultations" ON public.consultations FOR INSERT WITH CHECK (pet_owner_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Participants can update consultations" ON public.consultations FOR UPDATE USING (pet_owner_id = public.get_profile_id(auth.uid()) OR veterinarian_id = public.get_profile_id(auth.uid()));

-- Policies for messages
CREATE POLICY "Consultation participants can view messages" ON public.messages FOR SELECT USING (public.is_consultation_participant(consultation_id, auth.uid()));
CREATE POLICY "Consultation participants can send messages" ON public.messages FOR INSERT WITH CHECK (public.is_consultation_participant(consultation_id, auth.uid()) AND sender_id = public.get_profile_id(auth.uid()));

-- Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage own reviews" ON public.reviews FOR ALL USING (reviewer_id = public.get_profile_id(auth.uid()));

-- Policies for service listings
CREATE POLICY "Anyone can view active listings" ON public.service_listings FOR SELECT USING (is_active = true OR provider_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Providers can manage own listings" ON public.service_listings FOR ALL USING (provider_id = public.get_profile_id(auth.uid()));

-- Policies for bookings
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (customer_id = public.get_profile_id(auth.uid()) OR listing_id IN (SELECT id FROM public.service_listings WHERE provider_id = public.get_profile_id(auth.uid())));
CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT WITH CHECK (customer_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Participants can update bookings" ON public.bookings FOR UPDATE USING (customer_id = public.get_profile_id(auth.uid()) OR listing_id IN (SELECT id FROM public.service_listings WHERE provider_id = public.get_profile_id(auth.uid())));

-- Policies for articles
CREATE POLICY "Anyone can view published articles" ON public.articles FOR SELECT USING (is_published = true OR author_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage articles" ON public.articles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Policies for marketplace listings
CREATE POLICY "Anyone can view approved listings" ON public.marketplace_listings FOR SELECT USING ((is_active = true AND is_approved = true) OR seller_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sellers can manage own listings" ON public.marketplace_listings FOR ALL USING (seller_id = public.get_profile_id(auth.uid()));

-- Policies for orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = customer_id));
CREATE POLICY "Users can insert pending orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = customer_id) AND payment_status = 'pending');

-- Policies for order_items
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.profiles p ON o.customer_id = p.id
        WHERE o.id = order_items.order_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.profiles p ON o.customer_id = p.id
        WHERE o.id = order_items.order_id AND p.user_id = auth.uid()
    )
);

-- Policies for subscription plans
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Policies for subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Policies for audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Policies for notifications
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Policies for vet_presence
CREATE POLICY "Anyone can view vet presence" ON public.vet_presence FOR SELECT USING (true);
CREATE POLICY "Users can manage own presence" ON public.vet_presence FOR ALL USING (auth.uid() = user_id);

-- Policies for contact_messages
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON public.consultations(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_consultation_id ON public.messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_marketplace_active_approved ON public.marketplace_listings(is_active, is_approved);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- 8. Realtime Configuration
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vet_presence;

-- 9. Storage Configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('licenses', 'licenses', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('pet-avatars', 'pet-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('products', 'products', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Storage Policies

-- Licenses
CREATE POLICY "Users can upload their own license" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own license" ON storage.objects FOR SELECT USING (bucket_id = 'licenses' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Users can update their own license" ON storage.objects FOR UPDATE USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own license" ON storage.objects FOR DELETE USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Pet Avatars
CREATE POLICY "Anyone can view pet avatars" ON storage.objects FOR SELECT USING (bucket_id = 'pet-avatars');
CREATE POLICY "Authenticated users can upload pet avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pet-avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their pet avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'pet-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their pet avatars" ON storage.objects FOR DELETE USING (bucket_id = 'pet-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public Avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- 10. Initial Data
INSERT INTO public.subscription_plans (name, description, duration_months, price, currency, features)
VALUES
  ('Monthly', 'Monthly access to 24/7 vet consultations', 1, 5000, 'NGN', '["Unlimited vet consultations", "Pet health records", "24/7 availability", "Chat history"]'::jsonb),
  ('Yearly', 'Annual access with 2 months free', 12, 50000, 'NGN', '["Unlimited vet consultations", "Pet health records", "24/7 availability", "Chat history", "Priority support", "2 months free"]'::jsonb)
ON CONFLICT DO NOTHING;
