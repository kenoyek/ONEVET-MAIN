import { useId, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CareChat, CareChatSend } from '@/lib/services/care-chat-service';

type Props = {
  queryKey: QueryKey;
  load: () => Promise<CareChat | null>;
  send: (message: CareChatSend) => Promise<CareChat | null>;
  close?: () => Promise<CareChat | null>;
  onChange?: () => void;
};

export function CareChatThread({ queryKey, load, send, close, onChange }: Props) {
  const inputId = useId();
  const cache = useQueryClient();
  const [draft, setDraft] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const retry = useRef<CareChatSend | null>(null);
  const lock = useRef(false);
  const thread = useQuery({ queryKey, queryFn: load, refetchInterval: 5000, retry: false });
  const action = useMutation({
    mutationFn: async (message?: CareChatSend) => {
      const result = message ? await send(message) : await close?.();
      if (!result) throw Error('The conversation has expired.');
      return result;
    },
    onSuccess: async (result, message) => {
      await cache.cancelQueries({ queryKey, exact: true });
      cache.setQueryData(queryKey, result);
      if (message) {
        setDraft('');
        retry.current = null;
      }
      setConfirmClose(false);
      onChange?.();
    },
    onSettled: () => { lock.current = false; },
  });

  function perform(message?: CareChatSend) {
    if (lock.current) return;
    lock.current = true;
    action.mutate(message);
  }

  const canSend = thread.isSuccess && !thread.data?.closed && (!close || !!thread.data);
  const code = action.error && 'code' in action.error ? action.error.code : undefined;

  return (
    <div className="space-y-4">
      {thread.isPending && <p role="status">Opening chat…</p>}
      {thread.isError && <p role="alert">Could not load this chat. <Button variant="link" onClick={() => void thread.refetch()}>Retry</Button></p>}
      {thread.isSuccess && (
        <ol aria-label="Messages" className="max-h-96 space-y-3 overflow-y-auto rounded-lg border p-4" aria-live="polite" aria-relevant="additions">
          {!thread.data?.messages.length && <li className="text-muted-foreground">{close ? 'This chat is no longer available.' : 'Send a message to start.'}</li>}
          {thread.data?.messages.map(message => (
            <li key={message.id} className="rounded-md bg-muted p-3">
              <p className="text-sm font-semibold">{message.sender === 'team' ? 'Care team' : close ? 'Visitor' : 'You'}</p>
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
            </li>
          ))}
        </ol>
      )}
      {thread.data?.closed && <p role="status">This chat is closed.</p>}
      {canSend && (
        <form className="space-y-3" onSubmit={event => {
          event.preventDefault();
          const body = draft.trim();
          if (!body || lock.current) return;
          if (retry.current?.message_body !== body) {
            retry.current = { message_key: crypto.randomUUID(), message_body: body };
          }
          perform(retry.current);
        }}>
          <Label htmlFor={inputId}>{close ? 'Reply' : 'Your message'}</Label>
          <Textarea id={inputId} maxLength={2000} rows={3} required value={draft} disabled={action.isPending}
            onChange={event => setDraft(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button disabled={!draft.trim() || action.isPending}>Send message</Button>
            {close && <Button type="button" variant="outline" disabled={action.isPending || !!draft.trim()}
              onClick={() => setDraft('To see current availability and book online, use the Find veterinary care link above this conversation.')}>Use booking reply</Button>}
            {close && !confirmClose && <Button type="button" variant="ghost" disabled={action.isPending}
              onClick={() => setConfirmClose(true)}>Close chat</Button>}
          </div>
        </form>
      )}
      {canSend && confirmClose && (
        <div className="flex flex-wrap items-center gap-2">
          <p>Close this conversation?</p>
          <Button variant="destructive" disabled={action.isPending} onClick={() => perform()}>Confirm closure</Button>
          <Button variant="ghost" disabled={action.isPending} onClick={() => setConfirmClose(false)}>Keep open</Button>
        </div>
      )}
      {action.isError && <p role="alert" className="text-destructive">
        {code === '54000' ? 'Chat is busy. Wait a minute and try again.'
          : code === '54001' ? 'This chat has reached its message limit.'
          : 'Could not confirm the update. Try again.'}
      </p>}
    </div>
  );
}
