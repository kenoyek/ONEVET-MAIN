import { supabase } from '@/integrations/supabase/client';
import { BookingStatus, ServiceDeliveryMode } from '@/types/platform';

export interface CreateBookingInput {
  client_id: string; // Profile ID
  user_id: string; // Auth User ID
  pet_id?: string;
  provider_id: string;
  provider_service_id: string;
  location_id?: string;
  start_at: string;
  end_at: string;
  delivery_mode: ServiceDeliveryMode;
  client_notes?: string;
  travel_fee?: number;
}

export interface BookingPricing {
  subtotal: number;
  travelFee: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
}

export const bookingService = {
  /**
   * Calculate a client-side pricing estimate; final pricing must be enforced by the server
   */
  calculatePricing(basePrice: number, travelFee = 0, platformFeeRate = 0.05, taxRate = 0.075): BookingPricing {
    const subtotal = Math.max(0, basePrice);
    const validTravelFee = Math.max(0, travelFee);
    const platformFee = Math.round(subtotal * platformFeeRate * 100) / 100;
    const taxAmount = Math.round((subtotal + validTravelFee) * taxRate * 100) / 100;
    const totalAmount = Math.round((subtotal + validTravelFee + platformFee + taxAmount) * 100) / 100;

    return {
      subtotal,
      travelFee: validTravelFee,
      platformFee,
      taxAmount,
      totalAmount,
    };
  },

  /**
   * Check if a booking slot is available without overlapping existing appointments
   */
  async checkSlotAvailability(providerId: string, startAt: string, endAt: string, excludeBookingId?: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_booking_slot_available', {
      _provider_id: providerId,
      _start_at: startAt,
      _end_at: endAt,
      _exclude_booking_id: excludeBookingId || null,
    });

    if (error) {
      throw new Error('We could not confirm this appointment slot. Please try again before booking.');
    }
    return !!data;
  },

  /**
   * Create a new booking
   */
  async createBooking(input: CreateBookingInput) {
    // 1. Fetch service details
    const { data: service, error: serviceError } = await supabase
      .from('provider_services')
      .select('base_price, currency, requires_approval, name')
      .eq('id', input.provider_service_id)
      .single();

    if (serviceError || !service) throw new Error('Invalid service selected for booking');

    // 2. Check slot availability
    const isAvailable = await this.checkSlotAvailability(input.provider_id, input.start_at, input.end_at);
    if (!isAvailable) {
      throw new Error('The selected time slot is no longer available. Please select another slot.');
    }

    // 3. Calculate pricing
    const pricing = this.calculatePricing(Number(service.base_price), input.travel_fee || 0);

    // 4. Generate unique reference code
    const reference = `OV-BK-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const initialStatus: BookingStatus = service.requires_approval ? 'awaiting_confirmation' : 'confirmed';

    // 5. Insert booking
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        booking_reference: reference,
        client_id: input.client_id,
        customer_id: input.client_id, // Compatibility
        pet_id: input.pet_id || null,
        provider_id: input.provider_id,
        provider_service_id: input.provider_service_id,
        location_id: input.location_id || null,
        start_at: input.start_at,
        end_at: input.end_at,
        scheduled_date: input.start_at.split('T')[0],
        scheduled_time: input.start_at.split('T')[1]?.substring(0, 5) || '09:00',
        delivery_mode: input.delivery_mode,
        client_notes: input.client_notes || null,
        subtotal: pricing.subtotal,
        travel_fee: pricing.travelFee,
        platform_fee: pricing.platformFee,
        tax_amount: pricing.taxAmount,
        total_amount: pricing.totalAmount,
        currency: service.currency || 'NGN',
        status: initialStatus,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 6. Log status history
    await supabase.from('booking_status_history').insert({
      booking_id: booking.id,
      old_status: null,
      new_status: initialStatus,
      changed_by: input.user_id,
      notes: 'Initial booking created',
    });

    // 7. Add participants
    await supabase.from('booking_participants').insert([
      { booking_id: booking.id, user_id: input.user_id, role: 'client' },
    ]);

    // 8. Schedule in-app reminder (24h before)
    const reminderDate = new Date(new Date(input.start_at).getTime() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('booking_reminders').insert({
      booking_id: booking.id,
      scheduled_for: reminderDate,
      reminder_type: '24h_before',
      channel: 'in_app',
      status: 'pending',
    });

    return booking;
  },

  /**
   * Fetch bookings for a client
   */
  async getClientBookings(clientId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        pet:pets(id, name, species, avatar_url),
        service:provider_services(id, name, category, duration_minutes),
        provider:provider_organizations(id, name, slug, logo_url, phone, verification_status),
        location:provider_locations(id, name, address, city)
      `)
      .eq('client_id', clientId)
      .order('start_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Fetch bookings for a provider organization
   */
  async getProviderBookings(providerId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        pet:pets(id, name, species, avatar_url),
        client:profiles!client_id(id, first_name, last_name, email, phone),
        service:provider_services(id, name, category, duration_minutes),
        location:provider_locations(id, name, address)
      `)
      .eq('provider_id', providerId)
      .order('start_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Update booking status with audit trail
   */
  async updateBookingStatus(bookingId: string, newStatus: BookingStatus, userId: string, notes?: string) {
    const { data: current } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single();

    const oldStatus = current?.status || 'pending';

    const { data: updated, error } = await supabase
      .from('bookings')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('booking_status_history').insert({
      booking_id: bookingId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: userId,
      notes: notes || `Status updated to ${newStatus}`,
    });

    return updated;
  },
};
