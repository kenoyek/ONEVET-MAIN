import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { publicServices, directory } = vi.hoisted(() => ({ publicServices: vi.fn(), directory: vi.fn() }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => <nav>Navigation</nav> }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => <footer>Footer</footer> }));
vi.mock('@/components/shared/SEO', () => ({ SEO: () => null }));
vi.mock('@/hooks/useProviderMarketplace', () => ({ useProviderMarketplace: directory }));
vi.mock('@/lib/services/provider-catalog-service', async original => ({ ...await original<typeof import('@/lib/services/provider-catalog-service')>(), providerCatalogService: { publicServices } }));
import PublicProviderProfile from '@/pages/provider/PublicProviderProfile';
import ProviderMarketplace from '@/pages/marketplace/ProviderMarketplace';
function profile() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={cache}><MemoryRouter initialEntries={['/provider/public/approved-org']}><Routes><Route path="/provider/public/:slug" element={<PublicProviderProfile />} /></Routes></MemoryRouter></QueryClientProvider>);
}
describe('Published provider directory', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('keeps unpublished or ineligible providers unavailable without exposing private registration data', async () => {
    publicServices.mockResolvedValue([]);
    profile();
    expect(await screen.findByRole('heading', { name: 'Provider unavailable' })).toBeInTheDocument();
    expect(publicServices).toHaveBeenCalledWith('approved-org');
    expect(screen.queryByRole('link', { name: 'Contact the team' })).not.toBeInTheDocument();
  });
  it('shows declared service details without an appointment or payment claim', async () => {
    publicServices.mockResolvedValue([{ id: 'service-id', organization_name: 'Approved Organization', name: 'Grooming session', description: 'A provider-written service description.', city: 'Ibadan', state: 'Oyo', country: 'Nigeria', base_price: 5000, currency: 'NGN', duration_minutes: 45, delivery_mode: 'clinic_visit' }]);
    profile();
    expect(await screen.findByRole('heading', { name: 'Approved Organization' })).toBeInTheDocument();
    expect(screen.getByText('Appointment requests need confirmation')).toBeInTheDocument();
    expect(screen.getByText('Base fee: NGN 5,000.00')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /book now|pay now|request appointment/i })).not.toBeInTheDocument();
  });
  it('routes new listings to provider details and retains existing veterinary request links', () => {
    directory.mockReturnValue({ marketplaceItems: [
      { id: 'service-id', name: 'Organization grooming', category: 'grooming', base_price: 5000, currency: 'NGN', delivery_mode: 'clinic_visit', duration_minutes: 45, organization: { id: 'org-id', name: 'Approved Organization', slug: 'approved-org', verification_status: 'approved', city: 'Ibadan', country: 'Nigeria' } },
      { id: 'legacy-id', name: 'Existing veterinary care', category: 'vet_clinic', legacy: true, base_price: 4000, currency: 'NGN', delivery_mode: 'confirm_with_provider', organization: { id: 'vet-id', name: 'Existing Veterinarian', city: 'Ibadan', country: 'Nigeria' } },
    ], isLoading: false, isError: false, refetch: vi.fn() });
    render(<MemoryRouter><ProviderMarketplace /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'View provider' })).toHaveAttribute('href', '/provider/public/approved-org');
    expect(screen.getByRole('link', { name: 'Request veterinary care' })).toHaveAttribute('href', '/consultations/new');
    expect(screen.queryByRole('link', { name: 'Request appointment' })).not.toBeInTheDocument();
  });
});
