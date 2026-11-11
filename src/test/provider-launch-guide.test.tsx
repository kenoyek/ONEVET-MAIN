import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { publicServices, schedule } = vi.hoisted(() => ({ publicServices: vi.fn(), schedule: vi.fn() }));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { id: 'owner' } }) }));
vi.mock('@/lib/services/provider-catalog-service', () => ({ categoryByProvider: { grooming_business: 'grooming' }, providerCatalogService: { publicServices } }));
vi.mock('@/lib/services/appointment-service', () => ({ appointmentService: { schedule } }));
import { ProviderLaunchGuide } from '@/components/provider/ProviderLaunchGuide';
function mount(status = 'draft', providerType = 'grooming_business', suspended = false) {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={cache}><MemoryRouter><ProviderLaunchGuide providerId="org" slug="clinic" providerType={providerType} status={status} suspended={suspended} /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); publicServices.mockResolvedValue([]); schedule.mockResolvedValue(null); });
afterEach(cleanup);
describe('provider launch guide', () => {
  it('directs drafts to private evidence and keeps listing and availability separate', async () => {
    mount(); await waitFor(() => expect(screen.queryByText('Checking your public listing and saved availability…')).not.toBeInTheDocument());
    expect(screen.getByText(/Attach your registration evidence/)).toBeInTheDocument();
    expect(screen.getAllByLabelText('Complete')).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'Open this step' }).map(a => a.getAttribute('href'))).toEqual(['#business-details', '#organization-verification', '#organization-services', '#organization-availability']);
  });
  it('uses the public catalogue and enabled weekly schedule to show configured steps', async () => {
    publicServices.mockResolvedValue([{ id: 'published' }]); schedule.mockResolvedValue({ enabled: true, weekly: [{ weekday: 1, opens: 540, closes: 1020 }] });
    mount('approved'); await screen.findByText('At least one service is visible in the public catalogue.');
    expect(screen.getAllByLabelText('Complete')).toHaveLength(4);
    expect(screen.getByText(/Each request still needs confirmation/)).toBeInTheDocument();
  });
  it('does not mark suspended organizations ready using cached listing or schedule data', async () => {
    publicServices.mockResolvedValue([{ id: 'published' }]); schedule.mockResolvedValue({ enabled: true, weekly: [{}] });
    mount('approved', 'grooming_business', true); await screen.findByText(/Your organization is suspended/);
    expect(screen.getAllByLabelText('Complete')).toHaveLength(1);
  });
  it('shows failed checks with a working retry', async () => {
    publicServices.mockRejectedValueOnce(new Error('offline')).mockResolvedValue([]); mount('approved');
    await screen.findByRole('alert'); fireEvent.click(screen.getByRole('button', { name: 'Refresh setup checks' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument()); expect(publicServices).toHaveBeenCalledTimes(2);
  });
  it('gives shop businesses a relevant route without querying service or booking data', () => {
    mount('approved', 'pet_store'); expect(screen.getByRole('link', { name: 'Contact the team' })).toHaveAttribute('href', '/contact');
    expect(publicServices).not.toHaveBeenCalled(); expect(schedule).not.toHaveBeenCalled(); expect(screen.queryByText('4. Booking availability')).not.toBeInTheDocument();
  });
});
