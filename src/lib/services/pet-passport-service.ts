import { supabase as mainSupabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { PlannedRows } from '@/integrations/supabase/planned-types';
import { plannedSupabase as supabase } from '@/integrations/supabase/planned-client';

export interface AddAllergyInput {
  pet_id: string;
  allergen: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  notes?: string;
  recorded_by?: string;
}

export interface AddConditionInput {
  pet_id: string;
  condition_name: string;
  diagnosed_date?: string;
  status?: 'active' | 'managed' | 'resolved';
  notes?: string;
  diagnosed_by_vet_id?: string;
}

export interface AddMedicationInput {
  pet_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date?: string;
  end_date?: string;
  prescribed_by?: string;
}

export interface AddVaccinationInput {
  pet_id: string;
  vaccine_name: string;
  administered_date: string;
  next_due_date?: string;
  batch_number?: string;
  administered_by_vet_id?: string;
}

export interface LogWeightInput {
  pet_id: string;
  weight: number;
  unit?: string;
  recorded_by?: string;
}

export type PetProfile = Database['public']['Tables']['pets']['Row'] & Partial<Omit<PlannedRows['pets'], keyof Database['public']['Tables']['pets']['Row']>>;
export interface PassportRecord {
 pet: PetProfile | null; advancedAvailable: boolean;
 allergies: PlannedRows['pet_allergies'][]; conditions: PlannedRows['pet_conditions'][];
 medications: PlannedRows['pet_medications'][]; vaccinations: PlannedRows['pet_vaccinations'][];
 weightRecords: PlannedRows['pet_weight_records'][]; timeline: PlannedRows['pet_health_timeline'][];
 caregivers: (PlannedRows['pet_caregivers'] & {user: PlannedRows['profiles'] | null})[];
 documents: PlannedRows['pet_documents'][];
}

export const petPassportService = {
  async getPetPassport(petId: string): Promise<PassportRecord> {
    const {data:pet,error}=await mainSupabase.from('pets').select('*').eq('id',petId).maybeSingle();
    if(error)throw error;
    return {pet,advancedAvailable:false,allergies:[],conditions:[],medications:[],vaccinations:[],weightRecords:[],timeline:[],caregivers:[],documents:[]};
  },
  /**
   * Fetch full digital medical passport for a pet
   */
  async getPlannedPetPassport(petId: string) {
    const [
      { data: pet },
      { data: allergies },
      { data: conditions },
      { data: medications },
      { data: vaccinations },
      { data: weightRecords },
      { data: timeline },
      { data: caregivers },
      { data: documents },
    ] = await Promise.all([
      supabase.from('pets').select('*').eq('id', petId).single(),
      supabase.from('pet_allergies').select('*').eq('pet_id', petId),
      supabase.from('pet_conditions').select('*').eq('pet_id', petId),
      supabase.from('pet_medications').select('*').eq('pet_id', petId),
      supabase.from('pet_vaccinations').select('*').eq('pet_id', petId).order('administered_date', { ascending: false }),
      supabase.from('pet_weight_records').select('*').eq('pet_id', petId).order('recorded_at', { ascending: false }),
      supabase.from('pet_health_timeline').select('*').eq('pet_id', petId).order('event_date', { ascending: false }),
      supabase.from('pet_caregivers').select('*, user:profiles(*)').eq('pet_id', petId),
      supabase.from('pet_documents').select('*').eq('pet_id', petId).order('created_at', { ascending: false }),
    ]);

    return {
      pet,
      allergies: allergies || [],
      conditions: conditions || [],
      medications: medications || [],
      vaccinations: vaccinations || [],
      weightRecords: weightRecords || [],
      timeline: timeline || [],
      caregivers: caregivers || [],
      documents: documents || [],
    };
  },

  /**
   * Add Allergy
   */
  async addAllergy(input: AddAllergyInput) {
    const { data, error } = await supabase
      .from('pet_allergies')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    await this.logTimelineEvent(input.pet_id, 'document_upload', `Allergy Added: ${input.allergen}`, input.notes, input.recorded_by);
    return data;
  },

  /**
   * Add Condition
   */
  async addCondition(input: AddConditionInput) {
    const { data, error } = await supabase
      .from('pet_conditions')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    await this.logTimelineEvent(input.pet_id, 'diagnosis', `Medical Condition Diagnosed: ${input.condition_name}`, input.notes);
    return data;
  },

  /**
   * Add Medication
   */
  async addMedication(input: AddMedicationInput) {
    const { data, error } = await supabase
      .from('pet_medications')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    await this.logTimelineEvent(input.pet_id, 'prescription', `Prescription Added: ${input.medication_name}`, `Dosage: ${input.dosage}, Frequency: ${input.frequency}`);
    return data;
  },

  /**
   * Add Vaccination Record
   */
  async addVaccination(input: AddVaccinationInput) {
    const { data, error } = await supabase
      .from('pet_vaccinations')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    await this.logTimelineEvent(input.pet_id, 'vaccination', `Vaccine Administered: ${input.vaccine_name}`, `Next Due Date: ${input.next_due_date || 'N/A'}`);
    return data;
  },

  /**
   * Log Weight Record
   */
  async logWeight(input: LogWeightInput) {
    const { data, error } = await supabase
      .from('pet_weight_records')
      .insert({
        pet_id: input.pet_id,
        weight: input.weight,
        unit: input.unit || 'kg',
        recorded_by: input.recorded_by,
      })
      .select()
      .single();

    if (error) throw error;

    // Update primary weight on pet table
    await supabase.from('pets').update({ weight: input.weight }).eq('id', input.pet_id);
    await this.logTimelineEvent(input.pet_id, 'weight_update', `Weight Update: ${input.weight} ${input.unit || 'kg'}`, undefined, input.recorded_by);
    return data;
  },

  /**
   * Log Health Timeline Event
   */
  async logTimelineEvent(
    petId: string,
    eventType: 'consultation' | 'diagnosis' | 'vaccination' | 'prescription' | 'lab_result' | 'grooming' | 'weight_update' | 'admission' | 'procedure' | 'document_upload',
    title: string,
    description?: string,
    createdBy?: string,
    referenceId?: string
  ) {
    const { data, error } = await supabase
      .from('pet_health_timeline')
      .insert({
        pet_id: petId,
        event_type: eventType,
        title,
        description: description || null,
        created_by: createdBy || null,
        reference_id: referenceId || null,
        event_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) console.error('[PetPassportService] Timeline logging error:', error.message);
    return data;
  },

  /**
   * Invite Caregiver to Pet Record
   */
  async addCaregiver(petId: string, userId: string, permissionLevel: 'view_only' | 'manage_bookings' | 'manage_health_records' | 'full_owner_access', inviterId: string) {
    const { data, error } = await supabase
      .from('pet_caregivers')
      .insert({
        pet_id: petId,
        user_id: userId,
        permission_level: permissionLevel,
        invited_by: inviterId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
