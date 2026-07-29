import { describe, it, expect } from 'vitest';
import { livestockService } from '@/lib/services/livestock-service';

describe('Phase 13 Livestock & Production Animal Care Module Service', () => {
  it('exports livestockService with expected API methods', () => {
    expect(livestockService).toBeDefined();
    expect(typeof livestockService.registerFarm).toBe('function');
    expect(typeof livestockService.createHerdBatch).toBe('function');
    expect(typeof livestockService.logFlockHealthRecord).toBe('function');
    expect(typeof livestockService.getOwnerFarms).toBe('function');
  });
});
