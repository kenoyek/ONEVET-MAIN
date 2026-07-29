-- 1Vet Migration Phase 7: Groomer Management Module

-- 1. Create grooming_profiles Table
CREATE TABLE IF NOT EXISTS public.grooming_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  supported_species TEXT[] DEFAULT '{dog,cat}'::text[],
  supported_sizes TEXT[] DEFAULT '{small,medium,large,extra_large}'::text[],
  breed_restrictions TEXT,
  handling_limitations TEXT,
  mobile_grooming_available BOOLEAN DEFAULT false,
  salon_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create grooming_service_records Table
CREATE TABLE IF NOT EXISTS public.grooming_service_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  groomer_id UUID REFERENCES public.profiles(id) NOT NULL,
  coat_condition TEXT,
  skin_observations TEXT,
  services_completed TEXT[] DEFAULT '{}'::text[],
  products_used TEXT,
  behaviour_notes TEXT,
  incidents TEXT,
  before_photo_url TEXT,
  after_photo_url TEXT,
  next_recommended_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create grooming_preferences Table
CREATE TABLE IF NOT EXISTS public.grooming_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_style TEXT,
  shampoo_sensitivity TEXT,
  handling_notes TEXT,
  clipper_length TEXT,
  nail_preference TEXT,
  fragrance_preference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Triggers for updated_at
CREATE TRIGGER update_grooming_profiles_updated_at BEFORE UPDATE ON public.grooming_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_grooming_preferences_updated_at BEFORE UPDATE ON public.grooming_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE public.grooming_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view grooming profiles" ON public.grooming_profiles
  FOR SELECT USING (true);

CREATE POLICY "Groomers can manage their grooming profile" ON public.grooming_profiles
  FOR ALL USING (public.is_provider_member(auth.uid(), provider_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Pet owners and groomers can view grooming service records" ON public.grooming_service_records
  FOR SELECT USING (
    groomer_id = public.get_profile_id(auth.uid()) OR public.has_pet_access(auth.uid(), pet_id) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Groomers can create grooming service records" ON public.grooming_service_records
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'groomer') OR public.has_role(auth.uid(), 'service_provider') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Pet owners and groomers can view grooming preferences" ON public.grooming_preferences
  FOR SELECT USING (public.has_pet_access(auth.uid(), pet_id));

CREATE POLICY "Pet owners and groomers can manage grooming preferences" ON public.grooming_preferences
  FOR ALL USING (public.has_pet_access(auth.uid(), pet_id));

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_grooming_records_pet_id ON public.grooming_service_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_grooming_records_groomer_id ON public.grooming_service_records(groomer_id);
CREATE INDEX IF NOT EXISTS idx_grooming_prefs_pet_id ON public.grooming_preferences(pet_id);
