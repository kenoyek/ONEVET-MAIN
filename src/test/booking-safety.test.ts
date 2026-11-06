import { describe, expect, it, vi } from 'vitest';
import { bookingService } from '@/lib/services/booking-service';
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/planned-client', () => ({
  plannedSupabase: { rpc: mocks.rpc },
}));

describe('Booking availability safety', () => {
  it('refuses to declare a slot available when the authoritative check fails', async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: 'backend unavailable' },
    });
    await expect(
      bookingService.checkSlotAvailability(
        'provider',
        '2026-11-10T09:00:00Z',
        '2026-11-10T09:30:00Z',
      ),
    ).rejects.toThrow('could not confirm');
  });
  it('preserves a real unavailable result', async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    await expect(
      bookingService.checkSlotAvailability('provider', 'start', 'end'),
    ).resolves.toBe(false);
  });
  it('uses the authoritative positive result', async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    await expect(
      bookingService.checkSlotAvailability('provider', 'start', 'end'),
    ).resolves.toBe(true);
  });
});
