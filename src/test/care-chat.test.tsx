import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { CareChatThread } from '@/components/chat/CareChatThread';
import type { CareChat, CareChatSend } from '@/lib/services/care-chat-service';

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
