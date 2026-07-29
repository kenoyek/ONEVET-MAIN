-- 1Vet Migration Phase 8: Laboratory and Diagnostic Workflow

-- 1. Create laboratory_test_catalog Table
CREATE TABLE IF NOT EXISTS public.laboratory_test_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  test_code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  sample_required TEXT,
  fasting_required BOOLEAN NOT NULL DEFAULT false,
  turnaround_hours INTEGER NOT NULL DEFAULT 24,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create lab_orders Table
CREATE TABLE IF NOT EXISTS public.lab_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  ordering_vet_id UUID REFERENCES public.profiles(id) NOT NULL,
  lab_provider_id UUID REFERENCES public.provider_organizations(id) NOT NULL,
  sample_collection_mode TEXT DEFAULT 'clinic' CHECK (sample_collection_mode IN ('clinic', 'home_pickup', 'lab_walkin')),
  status TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN (
    'ordered', 'collection_scheduled', 'sample_collected',
    'in_transit', 'received_by_lab', 'processing', 'result_ready',
    'released', 'cancelled'
  )),
  clinical_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create lab_order_items Table
CREATE TABLE IF NOT EXISTS public.lab_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_order_id UUID REFERENCES public.lab_orders(id) ON DELETE CASCADE NOT NULL,
  test_catalog_id UUID REFERENCES public.laboratory_test_catalog(id) ON DELETE SET NULL,
  test_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- 4. Create lab_results Table
CREATE TABLE IF NOT EXISTS public.lab_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_order_id UUID REFERENCES public.lab_orders(id) ON DELETE CASCADE NOT NULL,
  released_by_id UUID REFERENCES public.profiles(id) NOT NULL,
  summary_findings TEXT NOT NULL,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  critical_alert_notes TEXT,
  result_file_url TEXT,
  released_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Trigger for updated_at
CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON public.lab_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Enable RLS
ALTER TABLE public.laboratory_test_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view lab test catalog" ON public.laboratory_test_catalog
  FOR SELECT USING (is_active = true);

CREATE POLICY "Lab staff can manage test catalog" ON public.laboratory_test_catalog
  FOR ALL USING (public.is_provider_member(auth.uid(), provider_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vets, labs and owners can view lab orders" ON public.lab_orders
  FOR SELECT USING (
    ordering_vet_id = public.get_profile_id(auth.uid()) OR
    public.is_provider_member(auth.uid(), lab_provider_id) OR
    public.has_pet_access(auth.uid(), pet_id) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Vets can create lab orders" ON public.lab_orders
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'veterinarian') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Participants can view order items" ON public.lab_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lab_orders lo WHERE lo.id = lab_order_items.lab_order_id
    )
  );

CREATE POLICY "Participants can view lab results" ON public.lab_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lab_orders lo WHERE lo.id = lab_results.lab_order_id
    )
  );

CREATE POLICY "Lab staff can issue lab results" ON public.lab_results
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'laboratory') OR public.has_role(auth.uid(), 'veterinarian') OR public.has_role(auth.uid(), 'admin')
  );

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_lab_orders_pet_id ON public.lab_orders(pet_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_ordering_vet ON public.lab_orders(ordering_vet_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_lab_provider ON public.lab_orders(lab_provider_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_order_id ON public.lab_results(lab_order_id);
