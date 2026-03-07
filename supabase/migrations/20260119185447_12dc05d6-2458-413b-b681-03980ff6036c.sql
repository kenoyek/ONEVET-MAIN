-- Create role enum for users
CREATE TYPE public.app_role AS ENUM ('pet_owner', 'veterinarian', 'service_provider', 'admin');

-- Create user_roles table for role management (separate from profile as per security best practices)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'pet_owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  license_number TEXT,
  license_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT FALSE,
  specialty TEXT,
  business_name TEXT,
  business_address TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create species enum
CREATE TYPE public.species_type AS ENUM ('dog', 'cat', 'bird', 'rabbit', 'fish', 'cattle', 'goat', 'sheep', 'poultry', 'pig', 'horse', 'other');

-- Create pets/livestock table
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create consultation status enum
CREATE TYPE public.consultation_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Create consultations table
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  veterinarian_id UUID REFERENCES public.profiles(id),
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  status consultation_status DEFAULT 'pending' NOT NULL,
  chief_complaint TEXT NOT NULL,
  notes TEXT,
  diagnosis TEXT,
  prescription TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create messages table for consultation chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create service category enum
CREATE TYPE public.service_category AS ENUM ('grooming', 'pet_sitting', 'training', 'vet_clinic', 'vet_store', 'boarding', 'transportation', 'other');

-- Create service listings table
CREATE TABLE public.service_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create articles table for education content
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create marketplace listings table for pet sales
CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  location TEXT,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
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

-- Create security definer function for role checking
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

-- Create function to get user's profile id
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Create function to check if user is consultation participant
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

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pets
CREATE POLICY "Owners can view their pets" ON public.pets FOR SELECT USING (
  owner_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'veterinarian')
);
CREATE POLICY "Owners can create pets" ON public.pets FOR INSERT WITH CHECK (owner_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Owners can update pets" ON public.pets FOR UPDATE USING (owner_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Owners can delete pets" ON public.pets FOR DELETE USING (owner_id = public.get_profile_id(auth.uid()));

-- RLS Policies for consultations
CREATE POLICY "Participants can view consultations" ON public.consultations FOR SELECT USING (
  pet_owner_id = public.get_profile_id(auth.uid()) OR 
  veterinarian_id = public.get_profile_id(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Pet owners can create consultations" ON public.consultations FOR INSERT WITH CHECK (pet_owner_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Participants can update consultations" ON public.consultations FOR UPDATE USING (
  pet_owner_id = public.get_profile_id(auth.uid()) OR veterinarian_id = public.get_profile_id(auth.uid())
);

-- RLS Policies for messages
CREATE POLICY "Consultation participants can view messages" ON public.messages FOR SELECT USING (
  public.is_consultation_participant(consultation_id, auth.uid())
);
CREATE POLICY "Consultation participants can send messages" ON public.messages FOR INSERT WITH CHECK (
  public.is_consultation_participant(consultation_id, auth.uid()) AND sender_id = public.get_profile_id(auth.uid())
);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (reviewer_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (reviewer_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (reviewer_id = public.get_profile_id(auth.uid()));

-- RLS Policies for service listings
CREATE POLICY "Anyone can view active listings" ON public.service_listings FOR SELECT USING (is_active = true OR provider_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Providers can create listings" ON public.service_listings FOR INSERT WITH CHECK (provider_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Providers can update own listings" ON public.service_listings FOR UPDATE USING (provider_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Providers can delete own listings" ON public.service_listings FOR DELETE USING (provider_id = public.get_profile_id(auth.uid()));

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (
  customer_id = public.get_profile_id(auth.uid()) OR 
  listing_id IN (SELECT id FROM public.service_listings WHERE provider_id = public.get_profile_id(auth.uid()))
);
CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT WITH CHECK (customer_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Participants can update bookings" ON public.bookings FOR UPDATE USING (
  customer_id = public.get_profile_id(auth.uid()) OR 
  listing_id IN (SELECT id FROM public.service_listings WHERE provider_id = public.get_profile_id(auth.uid()))
);

-- RLS Policies for articles
CREATE POLICY "Anyone can view published articles" ON public.articles FOR SELECT USING (is_published = true OR author_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage articles" ON public.articles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for marketplace listings
CREATE POLICY "Anyone can view approved listings" ON public.marketplace_listings FOR SELECT USING (
  (is_active = true AND is_approved = true) OR seller_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Users can create listings" ON public.marketplace_listings FOR INSERT WITH CHECK (seller_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Sellers can update own listings" ON public.marketplace_listings FOR UPDATE USING (seller_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Sellers can delete own listings" ON public.marketplace_listings FOR DELETE USING (seller_id = public.get_profile_id(auth.uid()));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'pet_owner'));
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_listings_updated_at BEFORE UPDATE ON public.service_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages (chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;