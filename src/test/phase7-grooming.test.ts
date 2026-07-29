import { describe, it, expect } from 'vitest';
import { groomingService } from '@/lib/services/grooming-service';

describe('Phase 7 Groomer Management Module Service', () => {
  it('exports groomingService with expected API methods', () => {
    expect(groomingService).toBeDefined();
    expect(typeof groomingService.getGroomingPreferences).toBe('function');
    expect(typeof groomingService.saveGroomingPreferences).toBe('function');
    expect(typeof groomingService.createGroomingRecord).toBe('function');
    expect(typeof groomingService.getPetGroomingHistory).toBe('function');
  });
});
