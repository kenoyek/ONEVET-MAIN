import { describe, it, expect } from 'vitest';
import { bookingService } from '@/lib/services/booking-service';

describe('Phase 5 Unified Booking & Scheduling Engine', () => {
  it('calculates pricing correctly server-side', () => {
    const pricing = bookingService.calculatePricing(10000, 2000, 0.05, 0.075);
    expect(pricing.subtotal).toBe(10000);
    expect(pricing.travelFee).toBe(2000);
    expect(pricing.platformFee).toBe(500); // 5% of 10000
    expect(pricing.taxAmount).toBe(900); // 7.5% of (10000 + 2000)
    expect(pricing.totalAmount).toBe(13400);
  });

  it('exports bookingService with expected API methods', () => {
    expect(bookingService).toBeDefined();
    expect(typeof bookingService.calculatePricing).toBe('function');
    expect(typeof bookingService.checkSlotAvailability).toBe('function');
    expect(typeof bookingService.createBooking).toBe('function');
    expect(typeof bookingService.getClientBookings).toBe('function');
    expect(typeof bookingService.getProviderBookings).toBe('function');
    expect(typeof bookingService.updateBookingStatus).toBe('function');
  });
});
