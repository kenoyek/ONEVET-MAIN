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
  category: 'veterinary' | 'grooming' | 'diagnostics' | 'training' | 'boarding' | 'pet_sitting' | 'transportation';
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

export const marketplaceService = {
  /**
   * Search published services & approved providers across the marketplace
   */
  async searchMarketplace(filter: SearchProvidersFilter) {
    let queryBuilder = supabase
      .from('provider_services')
      .select(`
        *,
        location:provider_locations(*),
        organization:provider_organizations(*)
      `)
      .eq('is_active', true);

    if (filter.category) {
      queryBuilder = queryBuilder.eq('category', filter.category);
    }

    if (filter.delivery_mode) {
      queryBuilder = queryBuilder.eq('delivery_mode', filter.delivery_mode);
    }

    if (filter.is_emergency_service) {
      queryBuilder = queryBuilder.eq('is_emergency_service', true);
    }

    if (filter.min_price !== undefined) {
      queryBuilder = queryBuilder.gte('base_price', filter.min_price);
    }

    if (filter.max_price !== undefined) {
      queryBuilder = queryBuilder.lte('base_price', filter.max_price);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;

    // Filter by provider status and search query if provided
    let results = (data || []).filter(
      (item: any) => item.organization && item.organization.status === 'active'
    );

    if (filter.query) {
      const q = filter.query.toLowerCase();
      results = results.filter(
        (item: any) =>
          item.name.toLowerCase().includes(q) ||
          item.organization.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    }

    if (filter.city) {
      const cityQ = filter.city.toLowerCase();
      results = results.filter(
        (item: any) =>
          (item.location && item.location.city.toLowerCase().includes(cityQ)) ||
          (item.organization.city && item.organization.city.toLowerCase().includes(cityQ))
      );
    }

    return results;
  },

  /**
   * Create a new bookable service listing for a provider
   */
  async createService(input: CreateServiceInput) {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data: org, error: orgError } = await supabase
      .from('provider_organizations')
      .select(`
        *,
        locations:provider_locations(*),
        services:provider_services(*),
        availability_rules:provider_availability_rules(*)
      `)
      .eq('slug', slug)
      .single();

    if (orgError) throw orgError;
    return org;
  },
};
