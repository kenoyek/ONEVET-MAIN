import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { slots } = vi.hoisted(() => ({ slots: vi.fn() }));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/lib/services/appointment-service', () => ({ appointmentService: { slots }, bookingTime: (value:string) => value + ' WAT', watDate: () => '2026-11-11' }));
import { PublicServiceAvailability } from '@/components/provider/PublicServiceAvailability';
import { initialBookingDate } from '@/lib/booking-date-range';
function mount() { const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } }); render(<QueryClientProvider client={cache}><MemoryRouter><PublicServiceAvailability serviceId="service-one" version={3} /></MemoryRouter></QueryClientProvider>); }
beforeEach(() => { slots.mockReset(); slots.mockResolvedValue([{start_at:'2026-11-11T10:00:00Z',end_at:'2026-11-11T10:30:00Z'}]); });
afterEach(cleanup);
describe('public appointment availability', () => {
  it('loads only on demand and preserves the selected service/date/time in the protected booking link', async () => {
    mount(); expect(slots).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole('button', {name:'Check available times'}));
    fireEvent.click(await screen.findByRole('button', {name:'2026-11-11T10:00:00Z WAT'}));
    const link=screen.getByRole('link', {name:'Sign in to request this time'});
    const url=new URL(link.getAttribute('href')!, 'https://1vet.store');
    expect(url.pathname).toBe('/booking/new'); expect(url.searchParams.get('service_id')).toBe('service-one'); expect(url.searchParams.get('date')).toBe('2026-11-11'); expect(url.searchParams.get('start')).toBe('2026-11-11T10:00:00Z');
    fireEvent.change(screen.getByLabelText('Appointment date · WAT'), {target:{value:'2026-11-12'}});
    expect(screen.queryByRole('link', {name:'Sign in to request this time'})).not.toBeInTheDocument();
  });
  it('offers a retry after errors and explains dates without slots', async () => {
    slots.mockRejectedValueOnce(new Error('offline')).mockResolvedValue([]); mount(); fireEvent.click(screen.getByRole('button', {name:'Check available times'}));
    await screen.findByRole('alert'); fireEvent.click(screen.getByRole('button', {name:'Retry availability'}));
    await screen.findByText('No times are available on this date. Try another date or provider.'); expect(slots).toHaveBeenCalledTimes(2);
  });
  it('does not request availability for an empty date', async () => {
    mount(); fireEvent.click(screen.getByRole('button', {name:'Check available times'})); await screen.findByRole('button', {name:'2026-11-11T10:00:00Z WAT'});
    fireEvent.change(screen.getByLabelText('Appointment date · WAT'), {target:{value:''}});
    await waitFor(()=>expect(screen.queryByRole('link')).not.toBeInTheDocument()); expect(slots).toHaveBeenCalledTimes(1);
  });
  it('accepts only real dates inside the booking window from shared links', () => {
    expect(initialBookingDate('2026-11-12','2026-11-11','2027-02-09')).toBe('2026-11-12');
    for(const value of ['2026-11-10','2027-02-30','bad',null])expect(initialBookingDate(value,'2026-11-11','2027-02-28')).toBe('2026-11-11');
  });
});
