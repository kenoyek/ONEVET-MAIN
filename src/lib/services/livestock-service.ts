import { supabase } from '@/integrations/supabase/client';

export interface RegisterFarmInput {
  owner_id: string; // Profile ID
  farm_name: string;
  registration_number?: string;
  farm_type: string;
  location_address: string;
  city: string;
  state: string;
  total_acreage?: number;
}

export interface CreateHerdBatchInput {
  farm_id: string;
  species: string;
  breed?: string;
  head_count: number;
  purpose?: string;
  housing_unit?: string;
}

export interface LogFlockHealthRecordInput {
  batch_id: string;
  attending_vet_id?: string;
  recorded_by_id: string;
  record_type: string;
  affected_count?: number;
  mortality_count?: number;
  observations: string;
  treatment_administered?: string;
  withdrawal_period_days?: number;
}

export const livestockService = {
  /**
   * Register a new commercial livestock farm
   */
  async registerFarm(input: RegisterFarmInput) {
    const { data, error } = await supabase
      .from('livestock_farms')
      .insert({
        owner_id: input.owner_id,
        farm_name: input.farm_name,
        registration_number: input.registration_number || null,
        farm_type: input.farm_type,
        location_address: input.location_address,
        city: input.city,
        state: input.state,
        total_acreage: input.total_acreage || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new livestock herd / flock batch
   */
  async createHerdBatch(input: CreateHerdBatchInput) {
    const batchCode = `OV-HERD-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const { data, error } = await supabase
      .from('livestock_batches')
      .insert({
        farm_id: input.farm_id,
        batch_code: batchCode,
        species: input.species,
        breed: input.breed || null,
        head_count: input.head_count,
        purpose: input.purpose || null,
        housing_unit: input.housing_unit || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Log flock health record, mass vaccination, or food safety withdrawal period
   */
  async logFlockHealthRecord(input: LogFlockHealthRecordInput) {
    const { data, error } = await supabase
      .from('flock_health_records')
      .insert({
        batch_id: input.batch_id,
        attending_vet_id: input.attending_vet_id || null,
        recorded_by_id: input.recorded_by_id,
        record_type: input.record_type,
        affected_count: input.affected_count || 0,
        mortality_count: input.mortality_count || 0,
        observations: input.observations,
        treatment_administered: input.treatment_administered || null,
        withdrawal_period_days: input.withdrawal_period_days || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetch farms owned by profile
   */
  async getOwnerFarms(ownerId: string) {
    const { data, error } = await supabase
      .from('livestock_farms')
      .select(`
        *,
        batches:livestock_batches(*)
      `)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
