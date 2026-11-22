import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import CareChatInbox from '@/pages/admin/CareChatInbox';
import { listCareChats, staffCareChat } from '@/lib/services/care-chat-service';

vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { id: 'admin' } }) }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/chat/CareChatAvailability', () => ({ StaffChatAvailability: () => null }));
vi.mock('@/lib/services/care-chat-service', () => ({
  careChatWaitingKey: (id: string) => ['care-chat', 'waiting', id],
  listCareChats: vi.fn(),
  staffCareChat: vi.fn(),
}));

it('starts with waiting chats, pages the results, and resets paging on a status change', async () => {
  const row = {
    id: 'first', updated_at: '2026-11-22T10:00:00Z', preview: 'Can I book grooming?',
    closed: false, awaiting_reply: true,
  };
  vi.mocked(listCareChats)
    .mockResolvedValueOnce({ items: [row], hasMore: true })
    .mockResolvedValueOnce({ items: [], hasMore: false })
    .mockResolvedValueOnce({ items: [], hasMore: false });
  render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter><CareChatInbox /></MemoryRouter>
  </QueryClientProvider>);

  await screen.findByText(row.preview);
  expect(listCareChats).toHaveBeenLastCalledWith('waiting', undefined);
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  await screen.findByText('No chats on this page.');
  expect(listCareChats).toHaveBeenLastCalledWith('waiting', { id: row.id, updated_at: row.updated_at });
  fireEvent.change(screen.getByLabelText('Chat status'), { target: { value: 'closed' } });
  await screen.findByText('No chats on this page.');
  expect(listCareChats).toHaveBeenLastCalledWith('closed', undefined);
  expect(screen.queryByRole('button', { name: 'Previous page' })).not.toBeInTheDocument();
});

it('keeps the selected chat open after replying moves it out of the waiting queue', async () => {
  vi.mocked(listCareChats).mockReset()
    .mockResolvedValueOnce({
      items: [{
        id: 'waiting', updated_at: '2026-11-22T10:00:00Z', preview: 'Can I book?',
        closed: false, awaiting_reply: true,
      }],
      hasMore: false,
    }).mockResolvedValue({ items: [], hasMore: false });
  vi.mocked(staffCareChat).mockReset()
    .mockResolvedValueOnce({ closed: false, messages: [] })
    .mockResolvedValueOnce({
      closed: false,
      messages: [{ id: 1, sender: 'team', body: 'Yes, see our directory.', created_at: '2026-11-22T10:01:00Z' }],
    });
  render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter><CareChatInbox /></MemoryRouter>
  </QueryClientProvider>);

  fireEvent.click(await screen.findByRole('button', { name: /Can I book/ }));
  fireEvent.change(await screen.findByLabelText('Reply'), { target: { value: 'Yes, see our directory.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  await screen.findByText('No chats awaiting a reply.');
  expect(screen.getByText('Yes, see our directory.')).toBeInTheDocument();
});
