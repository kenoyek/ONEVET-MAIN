import { plannedSupabase as supabase } from '@/integrations/supabase/planned-client';
import { petPassportService } from '@/lib/services/pet-passport-service';

export interface GroomingRecordInput {
  booking_id?: string;
  pet_id: string;
  groomer_id: string; // Groomer Profile ID
  user_id: string; // Auth User ID
  coat_condition: string;
  skin_observations?: string;
  services_completed: string[];
  products_used?: string;
  behaviour_notes?: string;
  incidents?: string;
  before_photo_url?: string;
  after_photo_url?: string;
  next_recommended_date?: string;
  has_health_escalation?: boolean;
}

export interface GroomingPreferencesInput {
  pet_id: string;
  preferred_style?: string;
  shampoo_sensitivity?: string;
  handling_notes?: string;
  clipper_length?: string;
  nail_preference?: string;
  fragrance_preference?: string;
}

export const groomingService = {
  /**
   * Fetch grooming preferences for a pet
   */
  async getGroomingPreferences(petId: string) {
    const { data, error } = await supabase
      .from('grooming_preferences')
      .select('*')
      .eq('pet_id', petId)
      .maybeSingle();

    if (error) console.warn('[GroomingService] Preferences fetch notice:', error.message);
    return data;
  },

  /**
   * Save or update pet grooming preferences
   */
  async saveGroomingPreferences(input: GroomingPreferencesInput) {
    const { data: existing } = await supabase
      .from('grooming_preferences')
      .select('id')
      .eq('pet_id', input.pet_id)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('grooming_preferences')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('grooming_preferences')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  /**
   * Create a grooming service record with health observation escalation
   */
  async createGroomingRecord(input: GroomingRecordInput) {
    const { data: record, error } = await supabase
      .from('grooming_service_records')
      .insert({
        booking_id: input.booking_id || null,
        pet_id: input.pet_id,
        groomer_id: input.groomer_id,
        coat_condition: input.coat_condition,
        skin_observations: input.skin_observations || null,
        services_completed: input.services_completed,
        products_used: input.products_used || null,
        behaviour_notes: input.behaviour_notes || null,
        incidents: input.incidents || null,
        before_photo_url: input.before_photo_url || null,
        after_photo_url: input.after_photo_url || null,
        next_recommended_date: input.next_recommended_date || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Log event to pet health timeline
    const eventTitle = input.has_health_escalation
      ? `Grooming Service Completed (Health Observation Noted)`
      : `Grooming Service Completed`;

    const description = `Services: ${input.services_completed.join(', ')}. Coat Condition: ${input.coat_condition}.${
      input.skin_observations ? ` Groomer Observation: ${input.skin_observations}` : ''
    }`;

    await petPassportService.logTimelineEvent(
      input.pet_id,
      'grooming',
      eventTitle,
      description,
      input.user_id,
      record.id
    );

    return record;
  },

  /**
   * Fetch grooming service history for a pet
   */
  async getPetGroomingHistory(petId: string) {
    const { data, error } = await supabase
      .from('grooming_service_records')
      .select(`
        *,
        groomer:profiles!groomer_id(id, first_name, last_name, business_name)
      `)
      .eq('pet_id', petId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
