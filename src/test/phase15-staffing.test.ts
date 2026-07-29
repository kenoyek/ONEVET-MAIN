import { describe, it, expect } from 'vitest';
import { staffingService } from '@/lib/services/staffing-service';

describe('Phase 15 Multi-Provider Staffing & Location Operations Service', () => {
  it('exports staffingService with expected API methods', () => {
    expect(staffingService).toBeDefined();
    expect(typeof staffingService.createStaffShift).toBe('function');
    expect(typeof staffingService.clockInShift).toBe('function');
    expect(typeof staffingService.clockOutShift).toBe('function');
    expect(typeof staffingService.createFacilityRoom).toBe('function');
    expect(typeof staffingService.setLocationOperatingHours).toBe('function');
  });
});
