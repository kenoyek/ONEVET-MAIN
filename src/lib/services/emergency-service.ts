import { plannedSupabase as supabase } from '@/integrations/supabase/planned-client';
import { petPassportService } from '@/lib/services/pet-passport-service';

export interface TriageQuestionsInput {
  is_breathing?: boolean; // false = +5
  is_conscious?: boolean; // false = +5
  has_bleeding?: boolean; // true = +4
  has_seizures?: boolean; // true = +4
  has_ingested_toxin?: boolean; // true = +3
}

export interface CreateEmergencyDispatchInput {
  requester_id: string; // Profile ID
  user_id: string; // Auth User ID
  pet_id?: string;
  chief_complaint: string;
  location_address: string;
  latitude?: number;
  longitude?: number;
  triage: TriageQuestionsInput;
}

export const emergencyService = {
  /**
   * Calculate emergency triage score & level
   */
  calculateTriageScore(triage: TriageQuestionsInput) {
    let score = 0;
    if (triage.is_conscious === false) score += 5;
    if (triage.is_breathing === false) score += 5;
    if (triage.has_bleeding === true) score += 4;
    if (triage.has_seizures === true) score += 4;
    if (triage.has_ingested_toxin === true) score += 3;

    let triageLevel: 'moderate' | 'urgent' | 'critical' = 'moderate';
    if (score >= 5) {
      triageLevel = 'critical';
    } else if (score >= 3) {
      triageLevel = 'urgent';
    }

    return { score, triageLevel };
  },

  /**
   * Create a 24/7 SOS Emergency Dispatch Request
   */
  async createEmergencyDispatch(input: CreateEmergencyDispatchInput) {
    const sosRef = `OV-SOS-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const { score, triageLevel } = this.calculateTriageScore(input.triage);

    // 1. Insert emergency dispatch
    const { data: dispatch, error: dErr } = await supabase
      .from('emergency_dispatches')
      .insert({
        dispatch_reference: sosRef,
        requester_id: input.requester_id,
        pet_id: input.pet_id || null,
        triage_level: triageLevel,
        chief_complaint: input.chief_complaint,
        location_address: input.location_address,
        latitude: input.latitude || null,
        longitude: input.longitude || null,
        status: 'requested',
      })
      .select()
      .single();

    if (dErr) throw dErr;

    // 2. Insert triage responses
    await supabase.from('emergency_triage_questions').insert({
      dispatch_id: dispatch.id,
      is_breathing: input.triage.is_breathing ?? true,
      is_conscious: input.triage.is_conscious ?? true,
      has_bleeding: input.triage.has_bleeding ?? false,
      has_seizures: input.triage.has_seizures ?? false,
      has_ingested_toxin: input.triage.has_ingested_toxin ?? false,
      computed_triage_score: score,
    });

    // 3. Log initial responder status
    await supabase.from('emergency_responder_logs').insert({
      dispatch_id: dispatch.id,
      status_update: 'requested',
      notes: `24/7 SOS Emergency request initiated (${triageLevel.toUpperCase()} priority, Score: ${score}). Searching nearest available responder.`,
    });

    // 4. Log to pet passport timeline if pet_id provided
    if (input.pet_id) {
      await petPassportService.logTimelineEvent(
        input.pet_id,
        'consultation',
        `24/7 SOS Emergency Care Dispatched (#${sosRef})`,
        `Triage Priority: ${triageLevel.toUpperCase()}. Complaint: ${input.chief_complaint}. Location: ${input.location_address}`,
        input.user_id,
        dispatch.id
      );
    }

    return dispatch;
  },

  /**
   * Update emergency dispatch status
   */
  async updateDispatchStatus(dispatchId: string, status: string, notes?: string) {
    const timestampUpdates: Record<string, string> = { status, updated_at: new Date().toISOString() };
    if (status === 'dispatched') timestampUpdates.dispatched_at = new Date().toISOString();
    if (status === 'arrived') timestampUpdates.arrived_at = new Date().toISOString();
    if (status === 'resolved') timestampUpdates.resolved_at = new Date().toISOString();

    const { data: dispatch, error } = await supabase
      .from('emergency_dispatches')
      .update(timestampUpdates)
      .eq('id', dispatchId)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('emergency_responder_logs').insert({
      dispatch_id: dispatchId,
      status_update: status,
      notes: notes || `Dispatch status updated to ${status}`,
    });

    return dispatch;
  },
};
