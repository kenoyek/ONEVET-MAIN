import { describe, it, expect } from 'vitest';
import { pharmacyService } from '@/lib/services/pharmacy-service';

describe('Phase 9 Pharmacy & Prescription Fulfillment Service', () => {
  it('exports pharmacyService with expected API methods', () => {
    expect(pharmacyService).toBeDefined();
    expect(typeof pharmacyService.validatePrescription).toBe('function');
    expect(typeof pharmacyService.createPrescriptionOrder).toBe('function');
    expect(typeof pharmacyService.dispensePrescriptionOrder).toBe('function');
    expect(typeof pharmacyService.getPharmacyInventory).toBe('function');
  });
});
