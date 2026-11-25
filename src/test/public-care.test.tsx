import {CareFinder} from '@/components/landing/CareFinder';
import {careSearchFilters} from '@/lib/care-search';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
      screen.getByRole('link', { name: 'Pet care' }),
    ).toHaveAttribute('href', '/pet-care');
    expect(
      screen.getByRole('link', { name: 'Farm & livestock care' }),
    ).toHaveAttribute('href', '/farm-care');
    expect(screen.getByRole('link', { name: 'Pet boarding' })).toHaveAttribute('href', '/boarding');
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

it('keeps delivery and urgent filters through search, browser back and reset',()=>{
 function Navigation(){const location=useLocation();const navigate=useNavigate();return <><output data-testid="search-url">{location.search}</output><button onClick={()=>navigate(-1)}>Browser back</button></>;}
 render(<MemoryRouter initialEntries={['/provider-marketplace?category=grooming&city=Ibadan&delivery=home_visit&urgent=1']}><ProviderMarketplace/><Navigation/></MemoryRouter>);
 expect(mocks.search).toHaveBeenLastCalledWith(expect.objectContaining({category:'grooming',city:'Ibadan',delivery_mode:'home_visit',is_emergency_service:true}));
 fireEvent.change(screen.getByLabelText('City'),{target:{value:'Lagos'}});fireEvent.click(screen.getByRole('button',{name:'Search'}));
 expect(new URLSearchParams(screen.getByTestId('search-url').textContent!).get('city')).toBe('Lagos');
 expect(mocks.search).toHaveBeenLastCalledWith(expect.objectContaining({city:'Lagos',delivery_mode:'home_visit',is_emergency_service:true}));
 fireEvent.click(screen.getByRole('button',{name:'Browser back'}));expect(screen.getByLabelText('City')).toHaveValue('Ibadan');
 fireEvent.click(screen.getByRole('button',{name:'Clear search filters'}));
 expect(screen.getByTestId('search-url').textContent).toBe('');
 expect(mocks.search).toHaveBeenLastCalledWith(expect.objectContaining({category:undefined,city:undefined,delivery_mode:undefined,is_emergency_service:undefined}));
});
it('resets a veterinary search without removing the required veterinary category',()=>{
 render(<MemoryRouter initialEntries={['/find-a-vet?city=Ibadan&delivery=video']}><ProviderMarketplace/></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:'Clear search filters'}));
 expect(mocks.search).toHaveBeenLastCalledWith(expect.objectContaining({category:'veterinary',city:undefined,delivery_mode:undefined}));
});

it('opens the boarding directory from the care finder with the entered city', () => {
  function BoardingDestination() {
    const { search } = useLocation();
    return <p>Boarding in {new URLSearchParams(search).get('city')}</p>;
  }

  render(<MemoryRouter><Routes>
    <Route path="/" element={<CareFinder />} />
    <Route path="/boarding" element={<BoardingDestination />} />
  </Routes></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Type of care'), { target: { value: 'boarding' } });
  fireEvent.change(screen.getByLabelText(/City/), { target: { value: ' Port Harcourt ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Find care' }));
  expect(screen.getByText('Boarding in Port Harcourt')).toBeInTheDocument();
});
