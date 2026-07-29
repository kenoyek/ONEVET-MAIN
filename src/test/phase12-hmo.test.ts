import { describe, it, expect } from 'vitest';
import { hmoService } from '@/lib/services/hmo-service';

describe('Phase 12 Pet Health Insurance & Subscription Engine Service', () => {
  it('exports hmoService with expected API methods', () => {
    expect(hmoService).toBeDefined();
    expect(typeof hmoService.getHMOPlans).toBe('function');
    expect(typeof hmoService.subscribePetToHMO).toBe('function');
    expect(typeof hmoService.getPetActiveHMOCoverage).toBe('function');
    expect(typeof hmoService.submitHMOClaim).toBe('function');
  });
});
