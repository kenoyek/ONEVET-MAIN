import { describe, it, expect } from 'vitest';
import { marketplaceService } from '@/lib/services/marketplace-service';

describe('Phase 4 Provider Services & Marketplace Discovery Engine', () => {
  it('exports marketplaceService with expected API methods', () => {
    expect(marketplaceService).toBeDefined();
    expect(typeof marketplaceService.searchMarketplace).toBe('function');
    expect(typeof marketplaceService.createService).toBe('function');
    expect(typeof marketplaceService.getProviderServices).toBe('function');
    expect(typeof marketplaceService.getPublicProviderProfile).toBe('function');
  });
});
