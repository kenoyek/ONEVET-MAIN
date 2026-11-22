import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import SupportInbox from '@/pages/admin/SupportInbox';
import { addSupportMessageNote, listSupportMessageNotes, listSupportMessages, markSupportMessageRead, setSupportMessageResolved } from '@/lib/services/support-inbox-service';

vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { id: 'admin' } }) }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/lib/services/support-inbox-service', () => ({
  addSupportMessageNote: vi.fn(), listSupportMessageNotes: vi.fn(),
  listSupportMessages: vi.fn(), markSupportMessageRead: vi.fn(), setSupportMessageResolved: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(listSupportMessageNotes).mockReset().mockResolvedValue({ notes: [], hasMore: false });
});

it('shows an unread submission, marks it read, and keeps its transcript visible', async () => {
  const message = {
    id: 'test-message', name: 'Ada', email: 'ada@example.invalid', subject: 'Booking help',
    message: 'How do I <strong>change</strong> my appointment?',
    created_at: '2026-11-22T12:00:00Z', is_read: false, resolved_at: null,
  };
  vi.mocked(listSupportMessages)
    .mockResolvedValueOnce({ records: [message], hasMore: false })
    .mockResolvedValueOnce({ records: [message], hasMore: false })
    .mockResolvedValueOnce({ records: [], hasMore: false })
    .mockResolvedValueOnce({ records: [{ ...message, is_read: true }], hasMore: false });
  vi.mocked(markSupportMessageRead).mockResolvedValue(undefined);
  render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter><SupportInbox /></MemoryRouter>
  </QueryClientProvider>);

  fireEvent.change(screen.getByLabelText('Messages'), { target: { value: 'unread' } });
  fireEvent.click(await screen.findByRole('button', { name: /Booking help/ }));
  expect(screen.getByText(message.message)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Mark read' }));
  await screen.findByText('No unread messages.');
  expect(markSupportMessageRead).toHaveBeenCalledExactlyOnceWith(message.id, true);
  expect(screen.getByText(message.message)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Messages'), { target: { value: 'all' } });
  await screen.findByRole('button', { name: /Booking help/ });
  expect(listSupportMessages).toHaveBeenLastCalledWith('all', undefined);
});

it('resolves a message in the open queue and allows it to be reopened', async () => {
  const message = {
    id: 'open-ticket', name: 'Ada', email: 'ada@example.invalid', subject: 'Booking follow-up',
    message: 'My question has been answered.', created_at: '2026-11-22T12:00:00Z',
    is_read: true, resolved_at: null,
  };
  vi.mocked(listSupportMessages).mockReset()
    .mockResolvedValueOnce({ records: [message], hasMore: false })
    .mockResolvedValueOnce({ records: [], hasMore: false })
    .mockResolvedValueOnce({ records: [message], hasMore: false });
  vi.mocked(setSupportMessageResolved)
    .mockResolvedValueOnce('2026-11-22T12:30:00Z')
    .mockResolvedValueOnce(null);
  render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter><SupportInbox /></MemoryRouter>
  </QueryClientProvider>);

  fireEvent.click(await screen.findByRole('button', { name: /Booking follow-up/ }));
  expect(listSupportMessages).toHaveBeenLastCalledWith('open', undefined);
  fireEvent.click(screen.getByRole('button', { name: 'Resolve' }));
  await screen.findByText('No open messages.');
  expect(setSupportMessageResolved).toHaveBeenLastCalledWith(message.id, true);
  fireEvent.click(screen.getByRole('button', { name: 'Reopen' }));
  await screen.findByRole('button', { name: /Booking follow-up/ });
  expect(setSupportMessageResolved).toHaveBeenLastCalledWith(message.id, false);
  expect(screen.getByRole('button', { name: 'Mark unread' })).toBeInTheDocument();
});

it('retries a private note with the same request key and displays the saved author', async () => {
  const message = {
    id: 'notes-ticket', name: 'Ada', email: 'ada@example.invalid', subject: 'Private follow-up',
    message: 'Please help with a booking.', created_at: '2026-11-22T12:00:00Z',
    is_read: true, resolved_at: null,
  };
  vi.mocked(listSupportMessages).mockReset().mockResolvedValue({ records: [message], hasMore: false });
  vi.mocked(addSupportMessageNote).mockRejectedValueOnce(Error('Response lost')).mockResolvedValueOnce(undefined);
  render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter><SupportInbox /></MemoryRouter>
  </QueryClientProvider>);

  fireEvent.click(await screen.findByRole('button', { name: /Private follow-up/ }));
  await screen.findByText('No notes on this page.');
  const draft = screen.getByLabelText('Add a private note');
  fireEvent.change(draft, { target: { value: 'Called the provider.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save note' }));
  await screen.findByRole('alert');
  expect(draft).toHaveValue('Called the provider.');
  vi.mocked(listSupportMessageNotes).mockResolvedValue({
    notes: [{ id: 1, author_name: 'Ada Admin', body: 'Called the provider.', created_at: '2026-11-22T12:30:00Z' }],
    hasMore: false,
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save note' }));
  await screen.findByText('Ada Admin');
  expect(vi.mocked(addSupportMessageNote).mock.calls[1]).toEqual(vi.mocked(addSupportMessageNote).mock.calls[0]);
  expect(draft).toHaveValue('');
});
