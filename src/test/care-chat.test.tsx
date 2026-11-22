import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { StaffChatAvailability, VisitorChatAvailability } from '@/components/chat/CareChatAvailability';
import { CareChatAlert } from '@/components/chat/CareChatAlert';
import { careChatWaitingKey, countWaitingCareChats, isCareChatAvailable, staffCareChatAvailability } from '@/lib/services/care-chat-service';
import { CareChatThread } from '@/components/chat/CareChatThread';
import type { CareChat, CareChatSend } from '@/lib/services/care-chat-service';

vi.mock('@/lib/services/care-chat-service', () => ({
  countWaitingCareChats: vi.fn(),
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
