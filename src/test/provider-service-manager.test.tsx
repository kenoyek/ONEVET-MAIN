import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { owned, publish, save } = vi.hoisted(() => ({ owned: vi.fn(), publish: vi.fn(), save: vi.fn() }));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { id: 'owner-id' } }) }));
vi.mock('@/lib/services/provider-catalog-service', async original => ({ ...await original<typeof import('@/lib/services/provider-catalog-service')>(), providerCatalogService: { owned, publish, save } }));
import { ProviderServiceManager } from '@/components/provider/ProviderServiceManager';
const item = { id: 'service-id', version: 3, provider_id: 'org-id', name: 'Grooming session', description: 'A clear description of our grooming service.', category: 'grooming', delivery_mode: 'clinic_visit', duration_minutes: 45, base_price: 5000, is_published: false };
function mount(approved = true) {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={cache}><MemoryRouter><ProviderServiceManager providerId="org-id" providerType="grooming_business" slug="test-clinic" approved={approved} suspended={false} /></MemoryRouter></QueryClientProvider>);
}
describe('Service owner workspace', () => {
  beforeEach(() => { vi.clearAllMocks(); owned.mockResolvedValue([item]); });
  it('requires an explicit public-disclosure acknowledgement before publishing', async () => {
    mount();
    const button = await screen.findByRole('button', { name: 'Publish service' });
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(button).toBeEnabled();
    publish.mockResolvedValue('service-id');
    fireEvent.click(button);
    await waitFor(() => expect(publish).toHaveBeenCalledWith(item, true));
  });
  it('keeps publication disabled for an unapproved organization', async () => {
    mount(false);
    await screen.findByRole('button', { name: 'Publish service' });
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: 'Publish service' })).toBeDisabled();
    expect(screen.getByText('Create a service draft')).toBeInTheDocument();
  });
  it('keeps a failed edit available for retry and explains a stale revision', async () => {
    save.mockRejectedValue({ code: '40001' });
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit service' }));
    const names = screen.getAllByLabelText('Public service name');
    fireEvent.change(names[0]!, { target: { value: 'Changed service name' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save service draft' })[0]!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Refresh');
    expect(screen.getAllByLabelText('Public service name')[0]).toHaveValue('Changed service name');
  });
});
