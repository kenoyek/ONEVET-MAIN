import { plannedSupabase as supabase } from '@/integrations/supabase/planned-client';
import { petPassportService } from '@/lib/services/pet-passport-service';

export interface CreateLabOrderItem {
  test_catalog_id?: string;
  test_name: string;
  price: number;
}

export interface CreateLabOrderInput {
  consultation_id?: string;
  booking_id?: string;
  pet_id: string;
  ordering_vet_id: string; // Vet Profile ID
  user_id: string; // Auth User ID
  lab_provider_id: string; // Lab Provider Org ID
  sample_collection_mode: 'clinic' | 'home_pickup' | 'lab_walkin';
  clinical_notes?: string;
  items: CreateLabOrderItem[];
}

export interface ReleaseLabResultInput {
  lab_order_id: string;
  released_by_profile_id: string; // Profile ID
  user_id: string; // Auth User ID
  summary_findings: string;
  is_critical?: boolean;
  critical_alert_notes?: string;
  result_file_url?: string;
}

export const labService = {
  /**
   * Create a new lab diagnostic order
   */
  async createLabOrder(input: CreateLabOrderInput) {
    if (!input.items || input.items.length === 0) {
      throw new Error('Lab order must contain at least one diagnostic test item.');
    }

    const orderNumber = `OV-LAB-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const { data: order, error: orderErr } = await supabase
      .from('lab_orders')
      .insert({
        order_number: orderNumber,
        consultation_id: input.consultation_id || null,
        booking_id: input.booking_id || null,
        pet_id: input.pet_id,
        ordering_vet_id: input.ordering_vet_id,
        lab_provider_id: input.lab_provider_id,
        sample_collection_mode: input.sample_collection_mode,
        clinical_notes: input.clinical_notes || null,
        status: 'ordered',
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    const itemsToInsert = input.items.map((i) => ({
      lab_order_id: order.id,
      test_catalog_id: i.test_catalog_id || null,
      test_name: i.test_name,
      price: i.price,
    }));

    const { error: itemsErr } = await supabase.from('lab_order_items').insert(itemsToInsert);
    if (itemsErr) throw itemsErr;

    // Log to pet passport timeline
    await petPassportService.logTimelineEvent(
      input.pet_id,
      'lab_result',
      `Laboratory Order Placed (#${orderNumber})`,
      `Tests: ${input.items.map((i) => i.test_name).join(', ')}. Collection: ${input.sample_collection_mode.replace('_', ' ')}`,
      input.user_id,
      order.id
    );

    return order;
  },

  /**
   * Update lab order sample tracking status
   */
  async updateOrderStatus(orderId: string, status: string) {
    const { data, error } = await supabase
      .from('lab_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Release lab test results
   */
  async releaseLabResult(input: ReleaseLabResultInput) {
    const { data: result, error: resErr } = await supabase
      .from('lab_results')
      .insert({
        lab_order_id: input.lab_order_id,
        released_by_id: input.released_by_profile_id,
        summary_findings: input.summary_findings,
        is_critical: input.is_critical || false,
        critical_alert_notes: input.critical_alert_notes || null,
        result_file_url: input.result_file_url || null,
      })
      .select()
      .single();

    if (resErr) throw resErr;

    // Update lab order status to released
    const { data: order } = await supabase
      .from('lab_orders')
      .update({ status: 'released', updated_at: new Date().toISOString() })
      .eq('id', input.lab_order_id)
      .select('pet_id, order_number')
      .single();

    if (order?.pet_id) {
      const eventTitle = input.is_critical
        ? `🚨 CRITICAL LAB RESULT RELEASED (#${order.order_number})`
        : `Diagnostic Lab Results Released (#${order.order_number})`;

      await petPassportService.logTimelineEvent(
        order.pet_id,
        'lab_result',
        eventTitle,
        `Findings: ${input.summary_findings}${input.is_critical ? ` [CRITICAL ALERT: ${input.critical_alert_notes}]` : ''}`,
        input.user_id,
        result.id
      );
    }

    return result;
  },

  /**
   * Fetch lab orders for a pet
   */
  async getPetLabOrders(petId: string) {
    const { data, error } = await supabase
      .from('lab_orders')
      .select(`
        *,
        items:lab_order_items(*),
        results:lab_results(*),
        ordering_vet:profiles!ordering_vet_id(id, first_name, last_name, license_number),
        lab_provider:provider_organizations!lab_provider_id(id, name, city)
      `)
      .eq('pet_id', petId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
