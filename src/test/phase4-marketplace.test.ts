import { describe, it, expect, vi } from 'vitest';
import { marketplaceService } from '@/lib/services/marketplace-service';
import { supabase } from '@/integrations/supabase/client';
import { providerCatalogService } from '@/lib/services/provider-catalog-service';

describe('Phase 4 Provider Services & Marketplace Discovery Engine', () => {
  it('exports marketplaceService with expected API methods', () => {
    expect(marketplaceService).toBeDefined();
    expect(typeof marketplaceService.searchMarketplace).toBe('function');
    expect(typeof marketplaceService.createService).toBe('function');
    expect(typeof marketplaceService.getProviderServices).toBe('function');
    expect(typeof marketplaceService.getPublicProviderProfile).toBe('function');
  });
});

it('matches FCT aliases across legacy and organization listings while respecting city', async () => {
  const from = vi.spyOn(supabase, 'from').mockReturnValue({
    select: () => Promise.resolve({ data: [
      { id: 'legacy-fct', location: 'Garki, Abuja (FCT), Nigeria' },
      { id: 'legacy-other', location: 'Garki, Jigawa' },
      { id: 'legacy-city-only', location: 'Garki' },
    ], error: null }),
  } as unknown as ReturnType<typeof supabase.from>);
  const publicServices = vi.spyOn(providerCatalogService, 'publicServices').mockResolvedValue([
    { id: 'org-fct', city: 'Garki', state: 'FCT', booking_enabled: true },
    { id: 'org-other-city', city: 'Wuse', state: 'Abuja' },
    { id: 'org-other-state', city: 'Garki', state: 'Jigawa' },
  ] as Awaited<ReturnType<typeof providerCatalogService.publicServices>>);
  try {
    const results = await marketplaceService.searchMarketplace({ state: 'Federal Capital Territory', city: 'Garki' });
    expect(results.map(result => result.id)).toEqual(['legacy-fct', 'org-fct']);
    expect(results.find(result => result.id === 'org-fct')?.booking_enabled).toBe(true);
  } finally {
    from.mockRestore();
    publicServices.mockRestore();
  }
});
