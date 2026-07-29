import { describe, it, expect } from 'vitest';
import { labService } from '@/lib/services/lab-service';

describe('Phase 8 Laboratory & Diagnostic Workflow Service', () => {
  it('exports labService with expected API methods', () => {
    expect(labService).toBeDefined();
    expect(typeof labService.createLabOrder).toBe('function');
    expect(typeof labService.updateOrderStatus).toBe('function');
    expect(typeof labService.releaseLabResult).toBe('function');
    expect(typeof labService.getPetLabOrders).toBe('function');
  });
});
