import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => <nav>Navigation</nav> }));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { id: 'owner-id' } }) }));
vi.mock('@/lib/services/provider-draft-service', async original => ({ ...await original<typeof import('@/lib/services/provider-draft-service')>(), providerDraftService: { get } }));
import ProviderDraftWorkspace from '@/pages/provider/ProviderDraftWorkspace';
function mount() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={cache}><MemoryRouter initialEntries={['/provider/organization/private-clinic']}><Routes><Route path="/provider/organization/:slug" element={<ProviderDraftWorkspace />} /></Routes></MemoryRouter></QueryClientProvider>);
  return cache;
}
describe('Private provider workspace', () => {
  beforeEach(() => { get.mockReset(); });
  it('shows a loading state without displaying a blank editable organization', () => {
    get.mockReturnValue(new Promise(() => {}));
    mount();
    expect(screen.getByRole('status')).toHaveTextContent('Loading organization');
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });
  it('hides the editor on access failure and supports retry', async () => {
    get.mockRejectedValue(new Error('Not found'));
    mount();
    expect(await screen.findByRole('heading', { name: 'Organization unavailable' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByRole('heading', { name: 'Organization unavailable' });
    expect(get).toHaveBeenCalledTimes(2);
  });
});
