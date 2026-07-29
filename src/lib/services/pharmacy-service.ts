import { supabase } from '@/integrations/supabase/client';
import { petPassportService } from '@/lib/services/pet-passport-service';

export interface CreateRxOrderItemInput {
  prescription_item_id?: string;
  inventory_id?: string;
  medication_name: string;
  quantity: number;
  unit_price: number;
}

export interface CreateRxOrderInput {
  prescription_id: string;
  client_id: string; // Profile ID
  user_id: string; // Auth User ID
  pet_id: string;
  pharmacy_provider_id: string;
  fulfillment_option: 'pickup' | 'delivery';
  delivery_address?: string;
  items: CreateRxOrderItemInput[];
}

export interface DispenseOrderInput {
  prescription_order_id: string;
  dispensed_by_profile_id: string; // Pharmacist profile ID
  user_id: string; // Auth User ID
  batch_number?: string;
  expiry_date?: string;
  notes?: string;
}

export const pharmacyService = {
  /**
   * Validate an official prescription by prescription_number or ID
   */
  async validatePrescription(prescriptionNumberOrId: string) {
    let queryBuilder = supabase
      .from('prescriptions')
      .select(`
        *,
        pet:pets(id, name, species),
        items:prescription_items(*),
        veterinarian:profiles!veterinarian_id(id, first_name, last_name, license_number)
      `);

    if (prescriptionNumberOrId.startsWith('OV-Rx-')) {
      queryBuilder = queryBuilder.eq('prescription_number', prescriptionNumberOrId);
    } else {
      queryBuilder = queryBuilder.eq('id', prescriptionNumberOrId);
    }

    const { data: rx, error } = await queryBuilder.single();
    if (error || !rx) throw new Error('Invalid or unverified prescription number');

    const now = new Date().toISOString().split('T')[0];
    if (rx.status !== 'active') throw new Error(`Prescription status is ${rx.status}`);
    if (rx.valid_until < now) throw new Error(`Prescription expired on ${rx.valid_until}`);

    return rx;
  },

  /**
   * Submit prescription order to a pharmacy
   */
  async createPrescriptionOrder(input: CreateRxOrderInput) {
    // 1. Validate prescription
    const rx = await this.validatePrescription(input.prescription_id);

    const orderNumber = `OV-RXO-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const totalPrice = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

    // 2. Insert order
    const { data: order, error: orderErr } = await supabase
      .from('prescription_orders')
      .insert({
        order_number: orderNumber,
        prescription_id: rx.id,
        client_id: input.client_id,
        pet_id: input.pet_id,
        pharmacy_provider_id: input.pharmacy_provider_id,
        fulfillment_option: input.fulfillment_option,
        delivery_address: input.delivery_address || null,
        total_price: totalPrice,
        status: 'submitted',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // 3. Insert items
    const itemsToInsert = input.items.map((i) => ({
      prescription_order_id: order.id,
      prescription_item_id: i.prescription_item_id || null,
      inventory_id: i.inventory_id || null,
      medication_name: i.medication_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      subtotal: i.quantity * i.unit_price,
    }));

    const { error: itemsErr } = await supabase.from('prescription_order_items').insert(itemsToInsert);
    if (itemsErr) throw itemsErr;

    return order;
  },

  /**
   * Dispense prescription medication (Pharmacist action)
   */
  async dispensePrescriptionOrder(input: DispenseOrderInput) {
    // 1. Fetch order & items
    const { data: order, error: orderErr } = await supabase
      .from('prescription_orders')
      .select(`
        *,
        items:prescription_order_items(*)
      `)
      .eq('id', input.prescription_order_id)
      .single();

    if (orderErr || !order) throw new Error('Prescription order not found');
    if (order.status === 'dispensed') throw new Error('Prescription order has already been dispensed');

    // 2. Insert dispense record
    const { data: dispense, error: dispErr } = await supabase
      .from('prescription_dispense_records')
      .insert({
        prescription_order_id: order.id,
        dispensed_by_id: input.dispensed_by_profile_id,
        batch_number: input.batch_number || null,
        expiry_date: input.expiry_date || null,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (dispErr) throw dispErr;

    // 3. Update order status
    await supabase
      .from('prescription_orders')
      .update({ status: 'dispensed', updated_at: new Date().toISOString() })
      .eq('id', order.id);

    // 4. Decrement inventory stock if linked
    for (const item of order.items || []) {
      if (item.inventory_id) {
        const { data: inv } = await supabase
          .from('pharmacy_inventories')
          .select('stock_quantity')
          .eq('id', item.inventory_id)
          .single();

        if (inv) {
          const newQty = Math.max(0, inv.stock_quantity - item.quantity);
          await supabase.from('pharmacy_inventories').update({ stock_quantity: newQty }).eq('id', item.inventory_id);
        }
      }
    }

    // 5. Log dispense to pet health passport
    await petPassportService.logTimelineEvent(
      order.pet_id,
      'prescription',
      `Prescription Dispensed (#${order.order_number})`,
      `Medications dispensed: ${order.items.map((i: { medication_name: string; quantity: number }) => `${i.medication_name} (x${i.quantity})`).join(', ')}. Batch: ${input.batch_number || 'N/A'}`,
      input.user_id,
      dispense.id
    );

    return dispense;
  },

  /**
   * Fetch inventory items for a pharmacy
   */
  async getPharmacyInventory(providerId: string) {
    const { data, error } = await supabase
      .from('pharmacy_inventories')
      .select('*')
      .eq('provider_id', providerId)
      .order('medication_name', { ascending: true });

    if (error) throw error;
    return data;
  },
};
