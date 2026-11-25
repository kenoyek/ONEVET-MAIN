import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import NotificationComposer from '@/pages/admin/NotificationComposer';

const { rpc, from, range } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), range: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc, from } }));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { id: 'admin-fixture' } }) }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));

it('previews a broadcast before sending and reuses its request ID on retry', async () => {
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), range };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  from.mockReturnValue(query);
  range.mockResolvedValueOnce({ data: [], error: null }).mockResolvedValue({
    data: [{
      id: 'broadcast-fixture', created_at: '2026-11-25T12:00:00Z',
      details: { title: 'Service update', message: 'New hours this weekend.', recipients: 3 },
    }], error: null,
  });
  rpc.mockResolvedValueOnce({ data: null, error: { message: 'Connection lost' } })
    .mockResolvedValueOnce({ data: 3, error: null });
  render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter><NotificationComposer /></MemoryRouter>
  </QueryClientProvider>);

  await screen.findByText('No notifications have been sent yet.');
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
  expect(await screen.findByText('3 recipients')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Service update'));
  expect(screen.getByText('New hours this weekend.')).toBeVisible();
  const reuse = screen.getByRole('button', { name: 'Use as draft' });
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Keep this draft' } });
  expect(reuse).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: '' } });
  fireEvent.click(reuse);
  expect(screen.getByLabelText('Title')).toHaveValue('Service update');
  expect(screen.getByLabelText('Title')).toHaveFocus();
  expect(screen.getByLabelText('Message')).toHaveValue('New hours this weekend.');
  fireEvent.click(screen.getByRole('button', { name: 'Review notification' }));
  expect(screen.getByRole('button', { name: 'Send to all active accounts' })).toBeEnabled();
  expect(rpc).toHaveBeenCalledTimes(2);
  expect(query.eq).toHaveBeenCalledWith('action', 'notification_broadcast_sent');
  expect(range).toHaveBeenCalledWith(0, 10);
});
