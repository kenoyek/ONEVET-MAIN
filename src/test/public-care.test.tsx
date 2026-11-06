import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
