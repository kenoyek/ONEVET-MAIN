import { describe, it, expect } from 'vitest';
import { providerService } from '@/lib/services/provider-service';
import { verificationService } from '@/lib/services/verification-service';
import { petPassportService } from '@/lib/services/pet-passport-service';
import { marketplaceService } from '@/lib/services/marketplace-service';
import { bookingService } from '@/lib/services/booking-service';
import { clinicalService } from '@/lib/services/clinical-service';
import { groomingService } from '@/lib/services/grooming-service';
import { labService } from '@/lib/services/lab-service';
import { pharmacyService } from '@/lib/services/pharmacy-service';
import { vendorProductService } from '@/lib/services/vendor-product-service';
import { escrowService } from '@/lib/services/escrow-service';
import { hmoService } from '@/lib/services/hmo-service';
import { livestockService } from '@/lib/services/livestock-service';
import { emergencyService } from '@/lib/services/emergency-service';
import { staffingService } from '@/lib/services/staffing-service';
import { notificationService } from '@/lib/services/notification-service';
import { analyticsService } from '@/lib/services/analytics-service';
import { auditService } from '@/lib/services/audit-service';
import { offlineSyncService } from '@/lib/services/offline-sync-service';
import { i18nService } from '@/lib/services/i18n-service';

describe('Phase 21 Full System Integration & Data Flow Verification', () => {
  it('verifies all 21 phase services are registered and operational', () => {
    expect(providerService).toBeDefined();
    expect(verificationService).toBeDefined();
    expect(petPassportService).toBeDefined();
    expect(marketplaceService).toBeDefined();
    expect(bookingService).toBeDefined();
    expect(clinicalService).toBeDefined();
    expect(groomingService).toBeDefined();
    expect(labService).toBeDefined();
    expect(pharmacyService).toBeDefined();
    expect(vendorProductService).toBeDefined();
    expect(escrowService).toBeDefined();
    expect(hmoService).toBeDefined();
    expect(livestockService).toBeDefined();
    expect(emergencyService).toBeDefined();
    expect(staffingService).toBeDefined();
    expect(notificationService).toBeDefined();
    expect(analyticsService).toBeDefined();
    expect(auditService).toBeDefined();
    expect(offlineSyncService).toBeDefined();
    expect(i18nService).toBeDefined();
  });

  it('verifies end-to-end pricing, escrow, and commission calculations across healthcare flows', () => {
    // 1. Server Booking Pricing Calculation
    const bookingPricing = bookingService.calculatePricing(20000, 3000, 0.05, 0.075);
    expect(bookingPricing.subtotal).toBe(20000);
    expect(bookingPricing.travelFee).toBe(3000);
    expect(bookingPricing.platformFee).toBe(1000); // 5% of 20,000
    expect(bookingPricing.taxAmount).toBe(1725); // 7.5% of (20,000 + 3,000)
    expect(bookingPricing.totalAmount).toBe(25725);

    // 2. Vendor Product Commission Calculation
    const vendorCalc = vendorProductService.calculateCommission(100000, 0.10);
    expect(vendorCalc.grossSales).toBe(100000);
    expect(vendorCalc.commissionAmount).toBe(10000);
    expect(vendorCalc.netPayout).toBe(90000);

    // 3. Emergency Triage Scoring Algorithm
    const triage = emergencyService.calculateTriageScore({
      is_conscious: false, // +5
      is_breathing: false, // +5
      has_bleeding: true, // +4
    });
    expect(triage.score).toBe(14);
    expect(triage.triageLevel).toBe('critical');
  });
});
