import { supabase } from '@/integrations/supabase/client';
import { licenseBelongsToApplicant } from './license-service';
import type { PendingVet } from './admin-vet-summary-service';

/** Apply a decision only to the pending licence snapshot the administrator reviewed. */
export async function reviewVeterinarian(application: PendingVet, approve: boolean) {
  if (!application.license_number?.trim() || !licenseBelongsToApplicant(application.license_url, application.user_id)) {
    throw new Error('Refresh and review a complete licence application before making a decision.');
  }
  const { data, error } = await supabase.from('profiles')
    .update({ verification_status: approve ? 'approved' : 'rejected', license_verified: approve })
    .eq('id', application.id)
    .eq('user_id', application.user_id)
    .eq('verification_status', 'pending')
    .eq('license_url', application.license_url!)
    .eq('license_number', application.license_number)
    .select('id, user_id');
  if (error) throw error;
  if (!data?.length) throw new Error('The application or your access has changed. Refresh the dashboard and review it again before making a decision.');
}
