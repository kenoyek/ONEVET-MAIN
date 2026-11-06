import { plannedSupabase as supabase } from '@/integrations/supabase/planned-client';
import { petPassportService } from '@/lib/services/pet-passport-service';

export interface SubscribeHMOPetInput {
  pet_id: string;
  owner_id: string; // Profile ID
  user_id: string; // Auth User ID
  plan_id: string;
  billing_cycle: 'monthly' | 'annual';
}

export interface SubmitHMOClaimInput {
  subscription_id: string;
  booking_id?: string;
  provider_id: string;
  service_type: string;
  claimed_amount: number;
}

export const hmoService = {
  /**
   * Fetch all active HMO insurance plans
   */
  async getHMOPlans() {
    const { data, error } = await supabase
      .from('hmo_plans')
      .select('*')
      .eq('is_active', true)
      .order('monthly_price', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Subscribe a pet to an HMO insurance plan
   */
  async subscribePetToHMO(input: SubscribeHMOPetInput) {
    const subRef = `OV-SUB-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const durationDays = input.billing_cycle === 'annual' ? 365 : 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: sub, error } = await supabase
      .from('pet_hmo_subscriptions')
      .insert({
        subscription_reference: subRef,
        pet_id: input.pet_id,
        owner_id: input.owner_id,
        plan_id: input.plan_id,
        billing_cycle: input.billing_cycle,
        status: 'active',
        expires_at: expiresAt,
      })
      .select(`
        *,
        plan:hmo_plans(*)
      `)
      .single();

    if (error) throw error;

    // Log to pet passport timeline
    await petPassportService.logTimelineEvent(
      input.pet_id,
      'document_upload',
      `Pet Enrolled in HMO Plan (${sub.plan?.name || 'HMO Coverage'})`,
      `Subscription #${subRef}. Valid until ${new Date(expiresAt).toLocaleDateString()}`,
      input.user_id,
      sub.id
    );

    return sub;
  },

  /**
   * Get active HMO subscription and coverage benefits for a pet
   */
  async getPetActiveHMOCoverage(petId: string) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('pet_hmo_subscriptions')
      .select(`
        *,
        plan:hmo_plans(*)
      `)
      .eq('pet_id', petId)
      .eq('status', 'active')
      .gte('expires_at', now)
      .maybeSingle();

    if (error) console.warn('[HMOService] Coverage fetch notice:', error.message);
    return data;
  },

  /**
   * Submit an HMO insurance claim
   */
  async submitHMOClaim(input: SubmitHMOClaimInput) {
    const claimNumber = `OV-CLM-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const { data: claim, error } = await supabase
      .from('hmo_claims')
      .insert({
        claim_number: claimNumber,
        subscription_id: input.subscription_id,
        booking_id: input.booking_id || null,
        provider_id: input.provider_id,
        service_type: input.service_type,
        claimed_amount: input.claimed_amount,
        approved_amount: input.claimed_amount, // Auto-adjudicated
        status: 'approved',
        adjudication_notes: 'Auto-adjudicated under HMO benefit coverage terms.',
      })
      .select()
      .single();

    if (error) throw error;
    return claim;
  },
};
