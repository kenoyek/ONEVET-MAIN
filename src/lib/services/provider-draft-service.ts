import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export const providerCategories = {
  veterinary_clinic: 'Veterinary clinic',
  independent_veterinarian: 'Independent veterinarian',
  grooming_business: 'Grooming business',
  diagnostic_laboratory: 'Diagnostic laboratory',
  pharmacy: 'Veterinary pharmacy',
  pet_store: 'Pet store',
  pet_trainer: 'Pet trainer',
  mobile_service_provider: 'Mobile service provider',
} as const;
export const providerDraftSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(3).max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.'),
  provider_type: z.enum(Object.keys(providerCategories) as [keyof typeof providerCategories, ...(keyof typeof providerCategories)[]]),
  description: z.string().trim().max(3000),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40),
  website: z.string().trim().max(300).refine(value => value === '' || /^https:\/\/[^\s]+$/.test(value), 'Use a full https:// website address.'),
  state: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(300),
  primary_location_name: z.string().trim().max(120).refine(value => value === '' || value.length >= 2, 'Use at least two characters for the branch name.'),
}).strict();
export type ProviderDraftInput = z.infer<typeof providerDraftSchema>;
export type ProviderDraft = Database['public']['Tables']['provider_organizations']['Row'];
export const emptyProviderDraft = (email = ''): ProviderDraftInput => ({
  name: '', slug: '', provider_type: 'veterinary_clinic', description: '', email,
  phone: '', website: '', state: '', city: '', address: '', primary_location_name: '',
});

export function providerDraftError(error: unknown): string {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? 'Check your organization details.';
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if (error.code === '23505') return 'That organization identifier is already in use. Check your saved organizations or choose another.';
    if (error.code === '42501') return 'This draft is unavailable or your account cannot edit it. Refresh and try again.';
  }
  return 'Could not save your organization. Your changes are still here; please try again.';
}

export const providerDraftService = {
  async save(input: ProviderDraftInput, id?: string) {
    const validated = providerDraftSchema.parse(input);
    const { data, error } = await supabase.rpc('save_provider_draft', { input: validated, ...(id ? { provider_uuid: id } : {}) });
    if (error) throw error;
    if (!data) throw new Error('No organization returned');
    return { id: data, slug: validated.slug };
  },
  async list() {
    const { data, error } = await supabase.from('provider_organizations').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async get(slug: string) {
    const { data: organization, error } = await supabase.from('provider_organizations').select('*').eq('slug', slug).single();
    if (error) throw error;
    const { data: location, error: locationError } = await supabase.from('provider_locations').select('*').eq('provider_id', organization.id).eq('is_primary', true).single();
    if (locationError) throw locationError;
    return { organization, location };
  },
};
