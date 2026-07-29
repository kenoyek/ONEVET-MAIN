-- 1Vet Migration Phase 9: Pharmacy and Prescription Fulfillment Network

-- 1. Create pharmacy_inventories Table
CREATE TABLE IF NOT EXISTS public.pharmacy_inventories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  medication_name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT NOT NULL,
  dosage_form TEXT NOT NULL,
  strength TEXT NOT NULL,
  sku TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  requires_prescription BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create prescription_orders Table
CREATE TABLE IF NOT EXISTS public.prescription_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE RESTRICT NOT NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  pharmacy_provider_id UUID REFERENCES public.provider_organizations(id) ON DELETE CASCADE NOT NULL,
  fulfillment_option TEXT NOT NULL DEFAULT 'delivery' CHECK (fulfillment_option IN ('pickup', 'delivery')),
  delivery_address TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'reviewing', 'approved', 'preparing',
    'ready_for_pickup', 'out_for_delivery', 'dispensed', 'cancelled'
  )),
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create prescription_order_items Table
CREATE TABLE IF NOT EXISTS public.prescription_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_order_id UUID REFERENCES public.prescription_orders(id) ON DELETE CASCADE NOT NULL,
  prescription_item_id UUID REFERENCES public.prescription_items(id) ON DELETE SET NULL,
  inventory_id UUID REFERENCES public.pharmacy_inventories(id) ON DELETE SET NULL,
  medication_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

-- 4. Create prescription_dispense_records Table
CREATE TABLE IF NOT EXISTS public.prescription_dispense_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_order_id UUID REFERENCES public.prescription_orders(id) ON DELETE CASCADE NOT NULL,
  dispensed_by_id UUID REFERENCES public.profiles(id) NOT NULL,
  batch_number TEXT,
  expiry_date DATE,
  dispensed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  notes TEXT
);

-- 5. Triggers for updated_at
CREATE TRIGGER update_pharmacy_inventories_updated_at BEFORE UPDATE ON public.pharmacy_inventories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prescription_orders_updated_at BEFORE UPDATE ON public.prescription_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Enable RLS
ALTER TABLE public.pharmacy_inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_dispense_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view active pharmacy inventories" ON public.pharmacy_inventories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Pharmacy staff can manage inventories" ON public.pharmacy_inventories
  FOR ALL USING (public.is_provider_member(auth.uid(), provider_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients, pharmacies, and vets can view prescription orders" ON public.prescription_orders
  FOR SELECT USING (
    client_id = public.get_profile_id(auth.uid()) OR
    public.is_provider_member(auth.uid(), pharmacy_provider_id) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Clients can insert prescription orders" ON public.prescription_orders
  FOR INSERT WITH CHECK (
    client_id = public.get_profile_id(auth.uid())
  );

CREATE POLICY "Participants can view order items" ON public.prescription_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prescription_orders po WHERE po.id = prescription_order_items.prescription_order_id
    )
  );

CREATE POLICY "Participants can view dispense records" ON public.prescription_dispense_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prescription_orders po WHERE po.id = prescription_dispense_records.prescription_order_id
    )
  );

CREATE POLICY "Pharmacy staff can create dispense records" ON public.prescription_dispense_records
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'pharmacy') OR public.has_role(auth.uid(), 'service_provider') OR public.has_role(auth.uid(), 'admin')
  );

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_pharmacy_inv_provider ON public.pharmacy_inventories(provider_id);
CREATE INDEX IF NOT EXISTS idx_rx_orders_rx_id ON public.prescription_orders(prescription_id);
CREATE INDEX IF NOT EXISTS idx_rx_orders_client_id ON public.prescription_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_rx_orders_pharmacy ON public.prescription_orders(pharmacy_provider_id);
