import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageItem, MessageTranscript } from '@/components/chat/MessageTranscript';

it('keeps the draft after a failed send and allows a retry', async () => {
  const send = vi.fn().mockRejectedValueOnce(Error('Offline')).mockResolvedValueOnce(undefined);
  render(<ChatInput onSend={send} />);
  const draft = screen.getByLabelText('Message');
  fireEvent.change(draft, { target: { value: '  Can we reschedule?  ' } });
  fireEvent.keyDown(draft, { key: 'Enter', shiftKey: true });
  expect(send).not.toHaveBeenCalled();
  fireEvent.keyDown(draft, { key: 'Enter' });
  await screen.findByRole('alert');
  expect(draft).toHaveValue('  Can we reschedule?  ');
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  await waitFor(() => expect(draft).toHaveValue(''));
  expect(send.mock.calls).toEqual([['Can we reschedule?'], ['Can we reschedule?']]);
});

it('keeps scroll position while reviewing past messages and can jump to the latest', () => {
  function transcript(count: number) {
    return (
      <MessageTranscript label="Conversation" empty="No messages." lastId={count}>
        <MessageItem sender="Care team" sentAt="2026-11-22T12:00:00Z" body="A reply" />
      </MessageTranscript>
    );
  }
  const view = render(transcript(1));
  const list = screen.getByRole('list', { name: 'Conversation' });
  Object.defineProperties(list, { scrollHeight: { value: 500 }, clientHeight: { value: 200 } });
  list.scrollTop = 50;
  fireEvent.scroll(list);
  view.rerender(transcript(2));
  expect(list.scrollTop).toBe(50);
  fireEvent.click(screen.getByRole('button', { name: 'Jump to latest' }));
  expect(list.scrollTop).toBe(500);
  expect(screen.queryByRole('button', { name: 'Jump to latest' })).not.toBeInTheDocument();
  expect(screen.getByText(/WAT/)).toHaveAttribute('datetime', '2026-11-22T12:00:00Z');
});
