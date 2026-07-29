import { supabase } from '@/integrations/supabase/client';

export interface LogActionInput {
  actor_id?: string;
  actor_role?: string;
  action: string; // e.g. VERIFICATION_APPROVED, PRESCRIPTION_ISSUED, ESCROW_RELEASED
  target_entity: string; // e.g. provider_organizations, prescriptions
  target_id: string;
  old_values?: any;
  new_values?: any;
}

export const auditService = {
  /**
   * Log sensitive platform operation for compliance auditing
   */
  async logPlatformAction(input: LogActionInput) {
    const { data, error } = await supabase
      .from('platform_audit_logs')
      .insert({
        actor_id: input.actor_id || null,
        actor_role: input.actor_role || null,
        action: input.action,
        target_entity: input.target_entity,
        target_id: input.target_id,
        old_values: input.old_values || null,
        new_values: input.new_values || null,
      })
      .select()
      .single();

    if (error) console.warn('[AuditService] Action log notice:', error.message);
    return data;
  },

  /**
   * Log pet health passport data access for privacy compliance
   */
  async logPetDataAccess(accessorId: string, petId: string, accessType: string) {
    const { data, error } = await supabase
      .from('data_access_logs')
      .insert({
        accessor_id: accessorId,
        accessed_pet_id: petId,
        access_type: accessType,
      })
      .select()
      .single();

    if (error) console.warn('[AuditService] Access log notice:', error.message);
    return data;
  },
};
