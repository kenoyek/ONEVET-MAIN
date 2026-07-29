import { describe, it, expect } from 'vitest';
import { vendorProductService } from '@/lib/services/vendor-product-service';

describe('Phase 10 Multi-Vendor Pet Product Marketplace Service', () => {
  it('calculates vendor commission and net payout correctly', () => {
    const calc = vendorProductService.calculateCommission(50000, 0.10);
    expect(calc.grossSales).toBe(50000);
    expect(calc.commissionAmount).toBe(5000); // 10%
    expect(calc.netPayout).toBe(45000);
  });

  it('exports vendorProductService with expected API methods', () => {
    expect(vendorProductService).toBeDefined();
    expect(typeof vendorProductService.createVendorProduct).toBe('function');
    expect(typeof vendorProductService.getVendorProducts).toBe('function');
    expect(typeof vendorProductService.getVendorCommissions).toBe('function');
  });
});
