import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import SupportInbox from '@/pages/admin/SupportInbox';
import { listSupportMessages, markSupportMessageRead } from '@/lib/services/support-inbox-service';

vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { id: 'admin' } }) }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/lib/services/support-inbox-service', () => ({
  listSupportMessages: vi.fn(), markSupportMessageRead: vi.fn(),
}));

it('shows an unread submission, marks it read, and keeps its transcript visible', async () => {
  const message = {
    id: 'test-message', name: 'Ada', email: 'ada@example.invalid', subject: 'Booking help',
    message: 'How do I <strong>change</strong> my appointment?',
    created_at: '2026-11-22T12:00:00Z', is_read: false,
  };
  vi.mocked(listSupportMessages)
    .mockResolvedValueOnce({ records: [message], hasMore: false })
    .mockResolvedValueOnce({ records: [], hasMore: false })
    .mockResolvedValueOnce({ records: [{ ...message, is_read: true }], hasMore: false });
  vi.mocked(markSupportMessageRead).mockResolvedValue(undefined);
  render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter><SupportInbox /></MemoryRouter>
  </QueryClientProvider>);

  fireEvent.click(await screen.findByRole('button', { name: /Booking help/ }));
  expect(screen.getByText(message.message)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Mark read' }));
  await screen.findByText('No unread messages.');
  expect(markSupportMessageRead).toHaveBeenCalledExactlyOnceWith(message.id, true);
  expect(screen.getByText(message.message)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Messages'), { target: { value: 'all' } });
  await screen.findByRole('button', { name: /Booking help/ });
  expect(listSupportMessages).toHaveBeenLastCalledWith(false, undefined);
});
