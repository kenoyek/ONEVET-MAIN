import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import NotificationComposer from '@/pages/admin/NotificationComposer';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));

it('previews a broadcast before sending and reuses its request ID on retry', async () => {
  rpc.mockResolvedValueOnce({ data: null, error: { message: 'Connection lost' } })
    .mockResolvedValueOnce({ data: 3, error: null });
  render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter><NotificationComposer /></MemoryRouter>
  </QueryClientProvider>);

  fireEvent.change(screen.getByLabelText('Title'), { target: { value: '  Service update  ' } });
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: '  New hours this weekend.  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review notification' }));
  expect(screen.getByText('New hours this weekend.')).toBeInTheDocument();
  expect(rpc).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Send to all active accounts' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Retry send' }));
  await screen.findByText('Notification sent to 3 accounts.');
  expect(rpc).toHaveBeenCalledTimes(2);
  expect(rpc).toHaveBeenCalledWith('send_admin_notification', {
    request_id: expect.any(String), notification_title: 'Service update',
    notification_message: 'New hours this weekend.',
  });
  expect(rpc.mock.calls[1]).toEqual(rpc.mock.calls[0]);
});
