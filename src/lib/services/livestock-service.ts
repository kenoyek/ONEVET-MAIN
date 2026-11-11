import { confirmedCreate } from '@/lib/confirmed-create';
import {
  farmSchema,
  batchSchema,
  observationSchema,
} from '@/lib/farm-validation';
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
  async registerFarm(input: RegisterFarmInput, recordId:string=crypto.randomUUID()) {
    farmSchema.parse(input);
    const payload={
      id:recordId,
        owner_id: input.owner_id,
        farm_name: input.farm_name,
        registration_number: input.registration_number || null,
        farm_type: input.farm_type,
        location_address: input.location_address,
        city: input.city,
        state: input.state,
        total_acreage: input.total_acreage || null,
    };
    const { data, error } = await supabase
      .from('livestock_farms')
      .insert(payload)
      .select()
      .single();

    return confirmedCreate({data,error},()=>supabase.from('livestock_farms').select('*').eq('id',recordId).eq('owner_id',input.owner_id).maybeSingle(),payload);
  },

  /**
   * Create a new livestock herd / flock batch
   */
  async createHerdBatch(input: CreateHerdBatchInput, recordId:string=crypto.randomUUID()) {
    batchSchema.parse(input);
    const batchCode = `OV-HERD-${recordId}`;

    const payload={
      id:recordId,
        farm_id: input.farm_id,
        batch_code: batchCode,
        species: input.species,
        breed: input.breed || null,
        head_count: input.head_count,
        purpose: input.purpose || null,
        housing_unit: input.housing_unit || null,
        status: 'active' as const,
    };
    const { data, error } = await supabase
      .from('livestock_batches')
      .insert(payload)
      .select()
      .single();

    return confirmedCreate({data,error},()=>supabase.from('livestock_batches').select('*').eq('id',recordId).eq('farm_id',input.farm_id).maybeSingle(),payload);
  },

  /**
   * Log flock health record, mass vaccination, or food safety withdrawal period
   */
  async logFlockHealthRecord(input: LogFlockHealthRecordInput, recordId:string=crypto.randomUUID()) {
    observationSchema.parse({
      ...input,
      affected_count: input.affected_count ?? 0,
      mortality_count: input.mortality_count ?? 0,
    });
    const payload={
      id:recordId,
        batch_id: input.batch_id,
        attending_vet_id: input.attending_vet_id || null,
        recorded_by_id: input.recorded_by_id,
        record_type: input.record_type,
        affected_count: input.affected_count || 0,
        mortality_count: input.mortality_count || 0,
        observations: input.observations,
        treatment_administered: input.treatment_administered || null,
        withdrawal_period_days: input.withdrawal_period_days || 0,
    };
    const { data, error } = await supabase
      .from('flock_health_records')
      .insert(payload)
      .select()
      .single();

    return confirmedCreate({data,error},()=>supabase.from('flock_health_records').select('*').eq('id',recordId).eq('batch_id',input.batch_id).eq('recorded_by_id',input.recorded_by_id).maybeSingle(),payload);
  },

  /**
   * Fetch farms owned by profile
   */
  async getOwnerFarms(ownerId: string) {
    const { data, error } = await supabase
      .from('livestock_farms')
      .select(
        `
        *
      `,
      )
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getOwnerFarm(ownerId: string, farmId: string) {
    const { data, error } = await supabase
      .from('livestock_farms')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('id', farmId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getBatches(farmId: string) {
    const { data, error } = await supabase
      .from('livestock_batches')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getHealthRecords(batchIds: string[]) {
    if (!batchIds.length) return [];
    const { data, error } = await supabase
      .from('flock_health_records')
      .select('*')
      .in('batch_id', batchIds)
      .order('recorded_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },
};
