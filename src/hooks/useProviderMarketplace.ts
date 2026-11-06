import { useQuery } from '@tanstack/react-query';
import { marketplaceService, SearchProvidersFilter, MarketplaceServiceItem } from '@/lib/services/marketplace-service';

export function useProviderMarketplace(filter: SearchProvidersFilter) {
  const query = useQuery({
    queryKey: ['provider-marketplace', filter],
    queryFn: async (): Promise<MarketplaceServiceItem[]> => {
      const data = await marketplaceService.searchMarketplace(filter);
      return data as MarketplaceServiceItem[];
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 60_000,
  });

  return {
    marketplaceItems: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
