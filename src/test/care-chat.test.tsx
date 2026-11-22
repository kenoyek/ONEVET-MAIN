import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { StaffChatAvailability, VisitorChatAvailability } from '@/components/chat/CareChatAvailability';
import { GuestCareChatAlert } from '@/components/chat/GuestCareChatAlert';
import { lastViewedCareChatReply, markCareChatReplyViewed, rememberCareChatKey } from '@/lib/care-chat-session';
import { CareChatAlert } from '@/components/chat/CareChatAlert';
import { careChatWaitingKey, countWaitingCareChats, hasCareChatReply, isCareChatAvailable, staffCareChatAvailability } from '@/lib/services/care-chat-service';
import { CareChatThread } from '@/components/chat/CareChatThread';
import type { CareChat, CareChatSend } from '@/lib/services/care-chat-service';

vi.mock('@/lib/services/care-chat-service', () => ({
  countWaitingCareChats: vi.fn(),
  hasCareChatReply: vi.fn(),
  careChatWaitingKey: (userId: string) => ['care-chat', 'waiting', userId],
  careChatAvailabilityKey: ['care-chat', 'availability'],
  isCareChatAvailable: vi.fn(),
  staffCareChatAvailability: vi.fn(),
}));

it('retains the visitor draft and retry key after a failed send', async () => {
  const cache = new QueryClient();
  const sent: CareChat = {
    closed: false,
    messages: [{ id: 1, sender: 'visitor', body: 'Which service should I book?', created_at: '2026-11-22T12:00:00Z' }],
  };
  const send = vi.fn<(message: CareChatSend) => Promise<CareChat | null>>()
    .mockRejectedValueOnce(Error('Connection lost'))
    .mockResolvedValueOnce(sent);
  render(<QueryClientProvider client={cache}>
    <CareChatThread queryKey={['visitor-chat']} load={async () => null} send={send} />
  </QueryClientProvider>);

  const field = await screen.findByLabelText('Your message');
  fireEvent.change(field, { target: { value: sent.messages[0]!.body } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  await screen.findByRole('alert');
  expect(field).toHaveValue(sent.messages[0]!.body);
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  await screen.findByText(sent.messages[0]!.body);
  expect(send.mock.calls[0]![0]).toEqual(send.mock.calls[1]![0]);
  expect(field).toHaveValue('');
});

it('asks staff to confirm before closing a chat', async () => {
  const cache = new QueryClient();
  const close = vi.fn().mockResolvedValue({ closed: true, messages: [] });
  render(<QueryClientProvider client={cache}>
    <CareChatThread queryKey={['staff-chat']} load={async () => ({ closed: false, messages: [] })}
      send={vi.fn()} close={close} />
  </QueryClientProvider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Close chat' }));
  expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm closure' }));
  await screen.findByText('This chat is closed.');
  expect(close).toHaveBeenCalledOnce();
  expect(screen.queryByLabelText('Reply')).not.toBeInTheDocument();
});

it('shows a visitor when the team is away', async () => {
  vi.mocked(isCareChatAvailable).mockResolvedValueOnce(false);
  render(<QueryClientProvider client={new QueryClient()}>
    <VisitorChatAvailability />
  </QueryClientProvider>);
  await screen.findByText(/The care team is away/);
});

it('lets staff go available and end their availability', async () => {
  vi.mocked(staffCareChatAvailability)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce('2026-11-22T12:30:00Z')
    .mockResolvedValueOnce(null);
  render(<QueryClientProvider client={new QueryClient()}>
    <StaffChatAvailability userId="admin" />
  </QueryClientProvider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Go available for 30 minutes' }));
  await screen.findByText(/You’re accepting live chats until/);
  expect(staffCareChatAvailability).toHaveBeenLastCalledWith(true);
  fireEvent.click(screen.getByRole('button', { name: 'Go away' }));
  await screen.findByRole('button', { name: 'Go available for 30 minutes' });
  expect(staffCareChatAvailability).toHaveBeenLastCalledWith(false);
});

it('links admins to the inbox and clears the badge when no chats are waiting', async () => {
  const cache = new QueryClient();
  vi.mocked(countWaitingCareChats).mockResolvedValue(2);
  render(<QueryClientProvider client={cache}>
    <MemoryRouter><CareChatAlert userId="admin" /></MemoryRouter>
  </QueryClientProvider>);
  const alert = await screen.findByRole('link', { name: 'Care chat inbox, 2 chats awaiting a reply' });
  expect(alert).toHaveAttribute('href', '/admin/care-chat');
  vi.mocked(countWaitingCareChats).mockResolvedValue(0);
  await cache.invalidateQueries({ queryKey: careChatWaitingKey('admin') });
  await screen.findByRole('link', { name: 'Care chat inbox' });
  expect(screen.queryByText('2')).not.toBeInTheDocument();
});

it('attaches the selected booking category and renders a directory link in the reply', async () => {
  const cache = new QueryClient();
  const send = vi.fn().mockResolvedValue({
    closed: false,
    messages: [{
      id: 2, sender: 'team', body: 'You can browse providers here.',
      created_at: '2026-11-22T12:00:00Z', booking_category: 'grooming',
    }],
  });
  render(<QueryClientProvider client={cache}>
    <MemoryRouter>
      <CareChatThread queryKey={['staff-chat-link']} load={async () => ({ closed: false, messages: [] })}
        send={send} close={vi.fn()} />
    </MemoryRouter>
  </QueryClientProvider>);
  fireEvent.change(await screen.findByLabelText('Reply'), { target: { value: 'You can browse providers here.' } });
  fireEvent.change(screen.getByLabelText('Booking link (optional)'), { target: { value: 'grooming' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  const bookingLink = await screen.findByRole('link', { name: 'Browse grooming & wellbeing' });
  expect(bookingLink).toHaveAttribute('href', '/provider-marketplace?category=grooming');
  expect(send).toHaveBeenCalledWith(expect.objectContaining({
    message_body: 'You can browse providers here.', booking_category: 'grooming',
  }));
  expect(screen.getByLabelText('Booking link (optional)')).toHaveValue('');
});

it('links visitors back to their chat when the team replies', async () => {
  const key = crypto.randomUUID();
  rememberCareChatKey(key);
  markCareChatReplyViewed(key, 4);
  vi.mocked(hasCareChatReply).mockResolvedValueOnce(true);
  try {
    render(<QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/services']}><GuestCareChatAlert /></MemoryRouter>
    </QueryClientProvider>);
    const link = await screen.findByRole('link', { name: 'New reply from the care team' });
    expect(link).toHaveAttribute('href', '/care-chat');
    expect(hasCareChatReply).toHaveBeenLastCalledWith(key, 4);
    const nextKey = crypto.randomUUID();
    rememberCareChatKey(nextKey);
    markCareChatReplyViewed(key, 10);
    expect(lastViewedCareChatReply(nextKey)).toBe(0);
  } finally {
    sessionStorage.removeItem('onevet-care-chat');
    sessionStorage.removeItem('onevet-care-chat-last-reply');
  }
});

it('marks the latest team reply viewed only when the chat tab is visible', async () => {
  const state = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  const viewed = vi.fn();
  const chat: CareChat = {
    closed: false,
    messages: [
      { id: 3, sender: 'team', body: 'Try the care directory.', created_at: '2026-11-22T10:00:00Z' },
      { id: 4, sender: 'visitor', body: 'Thanks.', created_at: '2026-11-22T10:01:00Z' },
    ],
  };
  try {
    render(<QueryClientProvider client={new QueryClient()}>
      <CareChatThread queryKey={['guest-view']} load={async () => chat} send={vi.fn()} onReplyViewed={viewed} />
    </QueryClientProvider>);
    await screen.findByText('Try the care directory.');
    expect(viewed).not.toHaveBeenCalled();
    state.mockReturnValue('visible');
    fireEvent(document, new Event('visibilitychange'));
    await waitFor(() => expect(viewed).toHaveBeenCalledExactlyOnceWith(3));
  } finally {
    state.mockRestore();
  }
});

it('requires confirmation to take over and only enables replies once assigned', async () => {
  const assign = vi.fn().mockResolvedValue({
    closed: false, owner_id: 'me', owned_by_me: true, messages: [],
  });
  render(<QueryClientProvider client={new QueryClient()}>
    <CareChatThread queryKey={['assigned-chat']}
      load={async () => ({ closed: false, owner_id: 'teammate', owned_by_me: false, messages: [] })}
      send={vi.fn()} close={vi.fn()} assign={assign} />
  </QueryClientProvider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Take over chat' }));
  expect(screen.queryByLabelText('Reply')).not.toBeInTheDocument();
  expect(assign).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm takeover' }));
  await screen.findByLabelText('Reply');
  expect(assign).toHaveBeenCalledExactlyOnceWith('teammate', false);
  expect(screen.getByRole('button', { name: 'Release chat' })).toBeInTheDocument();
});

it('lets a visitor end an existing chat after confirming and keeps its messages visible', async () => {
  const chat: CareChat = {
    closed: false,
    messages: [{ id: 1, sender: 'visitor', body: 'Thanks for your help.', created_at: '2026-11-22T10:00:00Z' }],
  };
  const endGuestChat = vi.fn().mockResolvedValue({ ...chat, closed: true });
  render(<QueryClientProvider client={new QueryClient()}>
    <CareChatThread queryKey={['end-visitor-chat']} load={async () => chat} send={vi.fn()} endGuestChat={endGuestChat} />
  </QueryClientProvider>);

  fireEvent.click(await screen.findByRole('button', { name: 'End chat' }));
  fireEvent.click(screen.getByRole('button', { name: 'Keep open' }));
  expect(endGuestChat).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'End chat' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm end chat' }));
  await screen.findByText('This chat is closed.');
  expect(endGuestChat).toHaveBeenCalledOnce();
  expect(screen.getByText('Thanks for your help.')).toBeInTheDocument();
  expect(screen.queryByLabelText('Your message')).not.toBeInTheDocument();
});
