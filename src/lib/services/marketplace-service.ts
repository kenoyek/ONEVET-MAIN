import { plannedSupabase } from '@/integrations/supabase/planned-client';
import { supabase } from '@/integrations/supabase/client';
import { ServiceDeliveryMode } from '@/types/platform';

export interface SearchProvidersFilter {
  category?: string;
  provider_type?: string;
  delivery_mode?: ServiceDeliveryMode;
  city?: string;
  is_emergency_service?: boolean;
  min_price?: number;
  max_price?: number;
  query?: string;
}

export interface CreateServiceInput {
  provider_id: string;
  location_id?: string;
  category:
    | 'veterinary'
    | 'grooming'
    | 'diagnostics'
    | 'training'
    | 'boarding'
    | 'pet_sitting'
    | 'transportation';
  name: string;
  description?: string;
  delivery_mode: ServiceDeliveryMode;
  duration_minutes: number;
  base_price: number;
  currency?: string;
  deposit_required?: boolean;
  deposit_amount?: number;
  is_emergency_service?: boolean;
  requires_pet_profile?: boolean;
}

export interface MarketplaceServiceItem {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  base_price: number;
  currency: string;
  delivery_mode: string;
  is_emergency_service?: boolean;
  is_active?: boolean;
  legacy?: boolean;
  organization?: {
    id: string;
    name: string;
    status: string;
    city?: string | null;
    [key: string]: unknown;
  } | null;
  location?: {
    id: string;
    city?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export const marketplaceService = {
  /**
   * Search published services & approved providers across the marketplace
   */
  async searchMarketplace(filter: SearchProvidersFilter) {
    // Main currently runs the original service-listing schema. This curated view
    // exposes approved providers without requiring undeployed organization tables.
    let queryBuilder = supabase.from('care_service_directory').select('*');
    if (filter.category)
      queryBuilder = queryBuilder.eq(
        'category',
        filter.category === 'veterinary' ? 'vet_clinic' : filter.category,
      );
    if (filter.min_price !== undefined)
      queryBuilder = queryBuilder.gte('base_price', filter.min_price);
    if (filter.max_price !== undefined)
      queryBuilder = queryBuilder.lte('base_price', filter.max_price);
    const { data, error } = await queryBuilder;
    if (error) throw error;
    // Legacy listings do not advertise channel, emergency coverage or precise durations.
    if (filter.delivery_mode || filter.is_emergency_service) return [];
    let results: MarketplaceServiceItem[] = (data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      base_price: Number(item.base_price),
      currency: item.currency,
      delivery_mode: 'confirm_with_provider',
      legacy: true,
      organization: {
        id: item.provider_id,
        name:
          item.business_name || `${item.first_name} ${item.last_name}`.trim(),
        status: 'active',
        verification_status: item.verification_status,
        provider_type:
          item.category === 'vet_clinic' ? 'veterinarian' : 'service_provider',
        country: 'Nigeria',
        city: item.location,
      },
      location: { id: item.id, city: item.location },
    }));
    if (filter.query) {
      const q = filter.query.toLowerCase();
      results = results.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.organization?.name &&
            item.organization.name.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)),
      );
    }

    if (filter.city) {
      const cityQ = filter.city.toLowerCase();
      results = results.filter(
        (item) =>
          (item.location?.city &&
            item.location.city.toLowerCase().includes(cityQ)) ||
          (item.organization?.city &&
            item.organization.city.toLowerCase().includes(cityQ)),
      );
    }

    return results;
  },

  /**
   * Create a new bookable service listing for a provider
   */
  async createService(input: CreateServiceInput) {
    const { data, error } = await plannedSupabase
      .from('provider_services')
      .insert({
        provider_id: input.provider_id,
        location_id: input.location_id || null,
        category: input.category,
        name: input.name,
        description: input.description || null,
        delivery_mode: input.delivery_mode,
        duration_minutes: input.duration_minutes,
        base_price: input.base_price,
        currency: input.currency || 'NGN',
        deposit_required: input.deposit_required || false,
        deposit_amount: input.deposit_amount || 0,
        is_emergency_service: input.is_emergency_service || false,
        requires_pet_profile: input.requires_pet_profile ?? true,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetch services for a specific provider organization
   */
  async getProviderServices(providerId: string) {
    const { data, error } = await plannedSupabase
      .from('provider_services')
      .select('*, location:provider_locations(*)')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Fetch provider public profile with locations, services, and verification badge
   */
  async getPublicProviderProfile(slug: string) {
    const { data: org, error: orgError } = await plannedSupabase
      .from('provider_organizations')
      .select(
        `
        *,
        locations:provider_locations(*),
        services:provider_services(*),
        availability_rules:provider_availability_rules(*)
      `,
      )
      .eq('slug', slug)
      .single();

    if (orgError) throw orgError;
    return org;
  },
};
