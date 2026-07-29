import { supabase } from '@/integrations/supabase/client';
import type { ProviderOrganization, ProviderMember, ProviderLocation, ProviderType } from '@/types/platform';

export interface CreateProviderOrgInput {
  name: string;
  slug: string;
  provider_type: ProviderType;
  description?: string;
  logo_url?: string;
  email: string;
  phone?: string;
  website?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  timezone?: string;
  currency?: string;
  primary_location_name?: string;
  primary_location_address?: string;
}

export interface InviteStaffInput {
  provider_id: string;
  email: string;
  member_role: 'owner' | 'manager' | 'staff' | 'practitioner';
  permissions: string[];
}

export const providerService = {
  /**
   * Create a new provider organization with primary location
   */
  async createOrganization(input: CreateProviderOrgInput, userId: string) {
    const { data: org, error: orgError } = await supabase
      .from('provider_organizations')
      .insert({
        name: input.name,
        slug: input.slug,
        provider_type: input.provider_type,
        description: input.description ?? null,
        logo_url: input.logo_url ?? null,
        email: input.email,
        phone: input.phone ?? null,
        website: input.website ?? null,
        country: input.country ?? 'Nigeria',
        state: input.state ?? null,
        city: input.city ?? null,
        address: input.address ?? null,
        timezone: input.timezone ?? 'Africa/Lagos',
        currency: input.currency ?? 'NGN',
        status: 'active',
        verification_status: 'draft',
        created_by: userId,
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // Auto-add creator as organization owner
    const { error: memberError } = await supabase
      .from('provider_members')
      .insert({
        provider_id: org.id,
        user_id: userId,
        member_role: 'owner',
        permissions: ['*'],
        status: 'active',
        invited_by: userId,
      });

    if (memberError) throw memberError;

    // Create primary location
    const locationName = input.primary_location_name || `${input.name} - Main Branch`;
    const locationAddress = input.primary_location_address || input.address || 'Main Address';

    const { data: location, error: locError } = await supabase
      .from('provider_locations')
      .insert({
        provider_id: org.id,
        name: locationName,
        address: locationAddress,
        city: input.city || 'Lagos',
        state: input.state || 'Lagos',
        country: input.country || 'Nigeria',
        phone: input.phone || null,
        timezone: input.timezone || 'Africa/Lagos',
        is_primary: true,
        is_active: true,
      })
      .select()
      .single();

    if (locError) console.warn('[ProviderService] Primary location creation notice:', locError.message);

    return { organization: org as ProviderOrganization, primaryLocation: location as ProviderLocation | null };
  },

  /**
   * Fetch organizations that a user belongs to
   */
  async getUserOrganizations(userId: string) {
    const { data, error } = await supabase
      .from('provider_members')
      .select(`
        *,
        organization:provider_organizations(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;
    return data;
  },

  /**
   * Fetch provider organization details by slug
   */
  async getOrganizationBySlug(slug: string) {
    const { data, error } = await supabase
      .from('provider_organizations')
      .select(`
        *,
        locations:provider_locations(*),
        members:provider_members(
          id, member_role, status, permissions,
          user:profiles(id, first_name, last_name, email, avatar_url)
        )
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Invite or add staff member to organization
   */
  async addStaffMember(input: InviteStaffInput, inviterId: string, targetUserId: string) {
    const { data, error } = await supabase
      .from('provider_members')
      .insert({
        provider_id: input.provider_id,
        user_id: targetUserId,
        member_role: input.member_role,
        permissions: input.permissions,
        status: 'active',
        invited_by: inviterId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ProviderMember;
  },
};
