import { supabase } from '@/integrations/supabase/client';
import { ProviderVerificationStatus, DocumentType } from '@/types/platform';

export interface ProviderDocumentInput {
  provider_id: string;
  document_type: DocumentType;
  document_number?: string;
  issuing_authority?: string;
  issued_at?: string;
  expires_at?: string;
  file_path: string;
}

export interface VerificationReviewInput {
  case_id: string;
  provider_id: string;
  new_status: ProviderVerificationStatus;
  rejection_reason?: string;
  internal_notes?: string;
  admin_id: string;
}

export const verificationService = {
  /**
   * Submit or update provider verification case
   */
  async submitVerificationCase(providerId: string, riskLevel: 'low' | 'medium' | 'high' = 'low') {
    const { data: existing } = await supabase
      .from('provider_verification_cases')
      .select('id')
      .eq('provider_id', providerId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('provider_verification_cases')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          risk_level: riskLevel,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      await this.updateOrganizationVerificationStatus(providerId, 'submitted');
      return data;
    } else {
      const { data, error } = await supabase
        .from('provider_verification_cases')
        .insert({
          provider_id: providerId,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          risk_level: riskLevel,
        })
        .select()
        .single();

      if (error) throw error;
      await this.updateOrganizationVerificationStatus(providerId, 'submitted');
      return data;
    }
  },

  /**
   * Upload provider document metadata
   */
  async uploadProviderDocument(input: ProviderDocumentInput) {
    const { data, error } = await supabase
      .from('provider_documents')
      .insert({
        provider_id: input.provider_id,
        document_type: input.document_type,
        document_number: input.document_number || null,
        issuing_authority: input.issuing_authority || null,
        issued_at: input.issued_at || null,
        expires_at: input.expires_at || null,
        file_path: input.file_path,
        verification_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetch all documents for a provider
   */
  async getProviderDocuments(providerId: string) {
    const { data, error } = await supabase
      .from('provider_documents')
      .select('*')
      .eq('provider_id', providerId);

    if (error) throw error;
    return data;
  },

  /**
   * Admin: Fetch pending verification queue
   */
  async getVerificationQueue() {
    const { data, error } = await supabase
      .from('provider_verification_cases')
      .select(`
        *,
        organization:provider_organizations(*)
      `)
      .in('status', ['submitted', 'under_review', 'more_info_required'])
      .order('submitted_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Admin: Review and update verification case status with audit logging
   */
  async reviewVerificationCase(input: VerificationReviewInput) {
    // 1. Get old status
    const { data: org } = await supabase
      .from('provider_organizations')
      .select('verification_status')
      .eq('id', input.provider_id)
      .single();

    const oldStatus = org?.verification_status || 'submitted';

    // 2. Update verification case
    const { data: vCase, error: caseError } = await supabase
      .from('provider_verification_cases')
      .update({
        status: input.new_status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: input.admin_id,
        rejection_reason: input.rejection_reason || null,
        internal_notes: input.internal_notes || null,
      })
      .eq('id', input.case_id)
      .select()
      .single();

    if (caseError) throw caseError;

    // 3. Update provider organization status
    await this.updateOrganizationVerificationStatus(input.provider_id, input.new_status);

    // 4. Log status change history
    await supabase.from('provider_status_history').insert({
      provider_id: input.provider_id,
      old_status: oldStatus,
      new_status: input.new_status,
      changed_by: input.admin_id,
      reason: input.rejection_reason || input.internal_notes || `Verification status updated to ${input.new_status}`,
    });

    return vCase;
  },

  /**
   * Helper: Update organization verification status
   */
  async updateOrganizationVerificationStatus(providerId: string, status: ProviderVerificationStatus) {
    const { data: org, error } = await supabase
      .from('provider_organizations')
      .update({ verification_status: status, updated_at: new Date().toISOString() })
      .eq('id', providerId)
      .select('created_by')
      .maybeSingle();

    if (error) console.error('[VerificationService] Failed to update org verification status:', error.message);

    if (org?.created_by) {
      const isApproved = status === 'approved';
      await supabase
        .from('profiles')
        .update({
          verification_status: status,
          license_verified: isApproved
        })
        .eq('user_id', org.created_by);
    }
  },
};
