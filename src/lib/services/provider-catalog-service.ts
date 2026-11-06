import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
export type ProviderService = Database['public']['Tables']['provider_services']['Row'];
export type CatalogService = Database['public']['Views']['provider_service_catalog']['Row'];
export const categoryByProvider: Record<string, 'veterinary' | 'grooming' | 'diagnostics' | 'training'> = { veterinary_clinic: 'veterinary', independent_veterinarian: 'veterinary', mobile_service_provider: 'veterinary', grooming_business: 'grooming', diagnostic_laboratory: 'diagnostics', pet_trainer: 'training' };
export const providerServiceSchema = z.object({
  name: z.string().trim().min(3).max(120), description: z.string().trim().min(20).max(3000),
  category: z.enum(['veterinary','grooming','diagnostics','training']),
  delivery_mode: z.enum(['clinic_visit','home_visit']),
  duration_minutes: z.number().int().min(5).max(480),
  base_price: z.number().min(0).max(9999999999.99).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.0001, 'Use at most two decimal places.'),
}).strict();
export type ProviderServiceInput = z.infer<typeof providerServiceSchema>;
export function publicationError(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? 'Check your service details.';
  if (typeof error === 'object' && error && 'code' in error) {
    if (error.code === '40001') return 'This service changed. Refresh the service list before trying again.';
    if (error.code === '42501') return 'This action is unavailable. Publishing requires current organization approval, valid credentials and an active owner account.';
    if (error.code === '22023') return 'Check the service category and details. Unpublish a listed service before editing it.';
    if (error.code === '23514') return 'Check the service limits, price and duration, or contact support.';
  }
  return 'Could not save the change. Your entries are still here; please try again.';
}
export const providerCatalogService = {
  async owned(providerId: string) {
    const { data, error } = await supabase.from('provider_services').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async save(providerId: string, input: ProviderServiceInput, existing?: Pick<ProviderService, 'id' | 'version'>) {
    const { data, error } = await supabase.rpc('save_provider_service', { provider_uuid: providerId, input: providerServiceSchema.parse(input), ...(existing ? { service_uuid: existing.id, expected_version: existing.version } : {}) });
    if (error) throw error;
    return data;
  },
  async publish(service: Pick<ProviderService, 'id' | 'version'>, publish: boolean) {
    const { data, error } = await supabase.rpc('set_provider_service_publication', { service_uuid: service.id, expected_version: service.version, publish });
    if (error) throw error;
    return data;
  },
  async publicServices(slug?: string) {
    let query = supabase.from('provider_service_catalog').select('*').order('updated_at', { ascending: false }).order('id');
    if (slug) query = query.eq('provider_slug', slug);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};
