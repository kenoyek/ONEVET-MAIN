import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannedSupabase as supabase } from '@/integrations/supabase/planned-client';
import { ProviderOrganization, ProviderLocation } from '@/types/platform';

export function useOrganizationSettings(slug: string | undefined) {
  const queryClient = useQueryClient();

  const organizationQuery = useQuery({
    queryKey: ['organization-settings', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data: org, error } = await supabase
        .from('provider_organizations')
        .select(`
          *,
          locations:provider_locations(*),
          services:provider_services(*),
          members:provider_members(*)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return org as ProviderOrganization & {
        locations: ProviderLocation[];
        services: Record<string, unknown>[];
        members: Record<string, unknown>[];
      };
    },
    enabled: Boolean(slug),
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: async (updates: Partial<ProviderOrganization>) => {
      if (!organizationQuery.data?.id) throw new Error('No organization loaded');
      const { data, error } = await supabase
        .from('provider_organizations')
        .update(updates)
        .eq('id', organizationQuery.data.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings', slug] });
    },
  });

  return {
    organization: organizationQuery.data || null,
    isLoading: organizationQuery.isLoading,
    isError: organizationQuery.isError,
    error: organizationQuery.error as Error | null,
    refetch: organizationQuery.refetch,
    updateOrganization: updateOrganizationMutation.mutateAsync,
    isUpdating: updateOrganizationMutation.isPending,
  };
}
