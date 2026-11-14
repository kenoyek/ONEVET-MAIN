import {CareFinder} from '@/components/landing/CareFinder';
import {careSearchFilters} from '@/lib/care-search';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hero } from '@/components/landing/Hero';
import { CarePathways } from '@/components/landing/CarePathways';
import ProviderMarketplace from '@/pages/marketplace/ProviderMarketplace';

const mocks = vi.hoisted(() => ({ refetch: vi.fn(), search: vi.fn() }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => null }));
vi.mock('@/hooks/useProviderMarketplace', () => ({
  useProviderMarketplace: (filter: unknown) => {
    mocks.search(filter);
    return {
      marketplaceItems: [],
      isLoading: false,
      isError: true,
      refetch: mocks.refetch,
    };
  },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Public care journeys', () => {
  it('offers pet and farm routes without unsupported statistics or reviews', () => {
    const { container } = render(
      <MemoryRouter>
        <Hero />
        <CarePathways />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('link', { name: /Find a veterinarian/i }),
    ).toHaveAttribute('href', '/find-a-vet');
    expect(
      screen.getByRole('link', { name: /Better care for every paw/i }),
    ).toHaveAttribute('href', '/pet-care');
    expect(
      screen.getByRole('link', { name: /Healthy animals/i }),
    ).toHaveAttribute('href', '/farm-care');
    expect(container.textContent).not.toMatch(
      /500\+|50k\+|instant availability guaranteed/i,
    );
    expect(
      screen.getByRole('heading', {
        name: /An emergency needs in-person care/i,
      }),
    ).toBeInTheDocument();
  });
  it('keeps discovery failure distinct from an empty search and offers retry', () => {
    render(
      <MemoryRouter initialEntries={['/find-a-vet']}>
        <ProviderMarketplace />
      </MemoryRouter>,
    );
    expect(mocks.search).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'veterinary' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We couldn’t load care services.',
    );
    expect(
      screen.queryByText('No services match your search'),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });
  it('submits search terms instead of requesting on every keystroke', () => {
    render(
      <MemoryRouter initialEntries={['/find-a-vet']}>
        <ProviderMarketplace />
      </MemoryRouter>,
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Search services or providers' }),
      { target: { value: ' poultry ' } },
    );
    expect(mocks.search).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: undefined }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(mocks.search).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: 'poultry' }),
    );
  });
});

it('carries homepage care type and city into public discovery without an account',async()=>{
 render(<MemoryRouter><Routes><Route path="/" element={<CareFinder/>}/><Route path="/provider-marketplace" element={<ProviderMarketplace/>}/></Routes></MemoryRouter>);
 fireEvent.change(screen.getByLabelText('Type of care'),{target:{value:'grooming'}});
 fireEvent.change(screen.getByLabelText(/City/),{target:{value:' Ibadan '}});
 fireEvent.click(screen.getByRole('button',{name:'Find care'}));
 await screen.findByText('We couldn’t load care services.');
 expect(mocks.search).toHaveBeenLastCalledWith(expect.objectContaining({category:'grooming',city:'Ibadan'}));
 expect(screen.getByLabelText('City')).toHaveValue('Ibadan');
});
it('bounds shared search filters and ignores unsupported categories',()=>{
 expect(careSearchFilters(new URLSearchParams('category=unsupported&city= Lagos &q= wellness '))).toEqual({category:'all',city:'Lagos',query:'wellness'});
 expect(careSearchFilters(new URLSearchParams({city:'x'.repeat(200)})).city).toHaveLength(80);
});
it('keeps the veterinarian directory limited to veterinary care even with a shared category',()=>{
 render(<MemoryRouter initialEntries={['/find-a-vet?category=grooming&city=Lagos']}><ProviderMarketplace/></MemoryRouter>);
 expect(mocks.search).toHaveBeenLastCalledWith(expect.objectContaining({category:'veterinary',city:'Lagos'}));
});
