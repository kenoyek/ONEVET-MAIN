import { supabase } from '@/integrations/supabase/client';
import { petPassportService } from '@/lib/services/pet-passport-service';

export interface SOAPNotesInput {
  consultation_id: string;
  chief_complaint?: string;
  subjective_notes?: string;
  objective_notes?: string;
  assessment?: string;
  treatment_plan?: string;
  diagnosis?: string;
  clinical_summary?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
}

export interface PrescriptionItemInput {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  refills_allowed?: number;
  special_instructions?: string;
}

export interface IssuePrescriptionInput {
  consultation_id?: string;
  pet_id: string;
  veterinarian_profile_id: string;
  valid_until: string;
  notes?: string;
  items: PrescriptionItemInput[];
}

export const clinicalService = {
  /**
   * Update SOAP clinical notes for a consultation
   */
  async updateSOAPNotes(input: SOAPNotesInput) {
    // Verify consultation is not already signed
    const { data: current } = await supabase
      .from('consultations')
      .select('signed_at')
      .eq('id', input.consultation_id)
      .single();

    if (current?.signed_at) {
      throw new Error('Signed clinical consultations cannot be modified directly. Amendments must be appended.');
    }

    const { data, error } = await supabase
      .from('consultations')
      .update({
        chief_complaint: input.chief_complaint,
        subjective_notes: input.subjective_notes || null,
        objective_notes: input.objective_notes || null,
        assessment: input.assessment || null,
        treatment_plan: input.treatment_plan || null,
        diagnosis: input.diagnosis || null,
        clinical_summary: input.clinical_summary || null,
        follow_up_required: input.follow_up_required ?? false,
        follow_up_date: input.follow_up_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.consultation_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Sign and lock clinical summary (Immutable signed record)
   */
  async signClinicalSummary(consultationId: string, vetUserId: string) {
    const signedAt = new Date().toISOString();

    const { data: consultation, error } = await supabase
      .from('consultations')
      .update({
        signed_at: signedAt,
        status: 'completed',
        completed_at: signedAt,
        updated_at: signedAt,
      })
      .eq('id', consultationId)
      .select()
      .single();

    if (error) throw error;

    // Automatically record to pet health passport timeline
    if (consultation.pet_id) {
      await petPassportService.logTimelineEvent(
        consultation.pet_id,
        'consultation',
        `Signed Clinical Summary: ${consultation.diagnosis || 'Veterinary Consultation'}`,
        consultation.clinical_summary || consultation.assessment || 'Consultation completed and signed.',
        vetUserId,
        consultationId
      );
    }

    return consultation;
  },

  /**
   * Issue server-authorized prescription
   */
  async issuePrescription(input: IssuePrescriptionInput, vetUserId: string) {
    if (!input.items || input.items.length === 0) {
      throw new Error('Prescription must contain at least one medication item.');
    }

    // 1. Generate unique prescription reference number
    const rxNumber = `OV-Rx-${Math.floor(10000000 + Math.random() * 90000000)}`;

    // 2. Insert prescription header
    const { data: rx, error: rxErr } = await supabase
      .from('prescriptions')
      .insert({
        prescription_number: rxNumber,
        consultation_id: input.consultation_id || null,
        pet_id: input.pet_id,
        veterinarian_id: input.veterinarian_profile_id,
        valid_until: input.valid_until,
        notes: input.notes || null,
        status: 'active',
      })
      .select()
      .single();

    if (rxErr) throw rxErr;

    // 3. Insert items
    const itemsToInsert = input.items.map((item) => ({
      prescription_id: rx.id,
      medication_name: item.medication_name,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      quantity: item.quantity,
      refills_allowed: item.refills_allowed || 0,
      special_instructions: item.special_instructions || null,
    }));

    const { error: itemsErr } = await supabase.from('prescription_items').insert(itemsToInsert);
    if (itemsErr) throw itemsErr;

    // 4. Record to pet health passport timeline & medications list
    for (const item of input.items) {
      await petPassportService.addMedication({
        pet_id: input.pet_id,
        medication_name: item.medication_name,
        dosage: item.dosage,
        frequency: item.frequency,
        prescribed_by: input.veterinarian_profile_id,
      });
    }

    await petPassportService.logTimelineEvent(
      input.pet_id,
      'prescription',
      `Official Prescription Issued (#${rxNumber})`,
      `Prescription valid until ${input.valid_until}. Items: ${input.items.map((i) => i.medication_name).join(', ')}`,
      vetUserId,
      rx.id
    );

    return rx;
  },

  /**
   * Fetch active prescriptions for a pet
   */
  async getPetPrescriptions(petId: string) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        items:prescription_items(*),
        veterinarian:profiles!veterinarian_id(id, first_name, last_name, license_number, specialty)
      `)
      .eq('pet_id', petId)
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
