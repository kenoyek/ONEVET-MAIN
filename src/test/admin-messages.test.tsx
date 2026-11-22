import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { AdminMessageNav } from '@/components/admin/AdminMessageNav';
import AdminMessages from '@/pages/admin/Messages';
import { countWaitingCareChats } from '@/lib/services/care-chat-service';
import { getSupportInboxTotals } from '@/lib/services/support-inbox-service';

vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { id: 'admin' } }) }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/lib/services/care-chat-service', () => ({
  careChatWaitingKey: (id: string) => ['care-chat', 'waiting', id],
  countWaitingCareChats: vi.fn(),
}));
vi.mock('@/lib/services/support-inbox-service', () => ({
  supportInboxKey: (id: string) => ['support-inbox', id],
  getSupportInboxTotals: vi.fn(),
}));

it('shows team workloads and links to the existing messaging routes', async () => {
  vi.mocked(countWaitingCareChats).mockResolvedValueOnce(2);
  vi.mocked(getSupportInboxTotals).mockResolvedValueOnce({ open: 6, unread: 3, resolved: 5 });
  render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter initialEntries={['/admin/messages']}>
      <Routes>
        <Route path="/admin/messages" element={<AdminMessages />} />
        <Route path="/admin/support" element={<AdminMessageNav />} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>);
  expect(await screen.findByText('2 awaiting reply')).toBeInTheDocument();
  expect(await screen.findByText('6 open · 3 unread')).toBeInTheDocument();
  const nav = within(screen.getByRole('navigation', { name: 'Admin messaging' }));
  expect(nav.getByRole('link', { name: 'Messages' })).toHaveAttribute('aria-current', 'page');
  fireEvent.click(nav.getByRole('link', { name: 'Support inbox' }));
  const supportNav = within(await screen.findByRole('navigation', { name: 'Admin messaging' }));
  expect(supportNav.getByRole('link', { name: 'Support inbox' })).toHaveAttribute('aria-current', 'page');
  expect(supportNav.getByRole('link', { name: 'Care chat' })).toHaveAttribute('href', '/admin/care-chat');
  expect(supportNav.getByRole('link', { name: 'Consultations' })).toHaveAttribute('href', '/admin/conversations');
});
