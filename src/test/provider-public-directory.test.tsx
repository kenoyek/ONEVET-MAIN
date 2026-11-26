import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
afterEach(cleanup);
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

it('filters only the current published list and restores services on clear',async()=>{
 const base={organization_name:'Approved Organization',city:'Ibadan',state:'Oyo',country:'Nigeria',currency:'NGN',duration_minutes:30,delivery_mode:'clinic_visit',booking_enabled:false};
 publicServices.mockResolvedValue([{...base,id:'vet',name:'Wellness visit',description:'Routine veterinary care.',category:'veterinary',base_price:5000},{...base,id:'groom',name:'Coat care',description:'Grooming for companions.',category:'grooming',base_price:null,delivery_mode:null}]);
 profile();await screen.findByRole('heading',{name:'Approved Organization'});
 fireEvent.change(screen.getByLabelText('Service category'),{target:{value:'grooming'}});
 expect(screen.getByRole('heading',{name:'Coat care'})).toBeInTheDocument();expect(screen.queryByRole('heading',{name:'Wellness visit'})).not.toBeInTheDocument();
 expect(screen.getByText('Base fee: Confirm with provider')).toBeInTheDocument();expect(screen.getByText(/Confirm delivery with provider/)).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Search this provider’s services'),{target:{value:'unmatched'}});expect(screen.getByText('No published services match these filters.')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Clear service filters'}));expect(screen.getByRole('heading',{name:'Wellness visit'})).toBeInTheDocument();
});

it('applies and clears a state filter on Find a Vet', () => {
  directory.mockReturnValue({ marketplaceItems: [], isLoading: false, isError: false, refetch: vi.fn() });
  render(<MemoryRouter initialEntries={['/find-a-vet?city=Garki']}><ProviderMarketplace /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('State or FCT'), { target: { value: 'Federal Capital Territory' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  expect(directory).toHaveBeenLastCalledWith(expect.objectContaining({
    category: 'veterinary', city: 'Garki', state: 'Federal Capital Territory',
  }));
  fireEvent.click(screen.getByRole('button', { name: 'Clear search filters' }));
  expect(screen.getByLabelText('State or FCT')).toHaveValue('');
  expect(directory).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'veterinary', state: undefined }));
});
