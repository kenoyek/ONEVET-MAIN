import { useEffect, useId, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { careSearchCategories, careSearchLink } from '@/lib/care-search';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CareChat, CareChatBookingCategory, CareChatSend } from '@/lib/services/care-chat-service';

type Props = {
  queryKey: QueryKey;
  load: () => Promise<CareChat | null>;
  send: (message: CareChatSend) => Promise<CareChat | null>;
  close?: () => Promise<CareChat | null>;
  assign?: (expectedOwner: string | null, release: boolean) => Promise<CareChat | null>;
  onChange?: () => void;
  onReplyViewed?: (id: number) => void;
};

export function CareChatThread({ queryKey, load, send, close, assign, onChange, onReplyViewed }: Props) {
  const inputId = useId();
  const bookingId = useId();
  const cache = useQueryClient();
  const [draft, setDraft] = useState('');
  const [bookingCategory, setBookingCategory] = useState<CareChatBookingCategory | ''>('');
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmTakeover, setConfirmTakeover] = useState<string | null>(null);
  const retry = useRef<CareChatSend | null>(null);
  const lock = useRef(false);
  const thread = useQuery({ queryKey, queryFn: load, refetchInterval: 5000, retry: false });
  const messagesRef = useRef<HTMLOListElement>(null);
  const latestReply = thread.data?.messages.filter(message => message.sender === 'team').at(-1)?.id;

  useEffect(() => {
    if (!onReplyViewed || !thread.isSuccess || latestReply === undefined) return;
    function viewReply() {
      if (document.visibilityState !== 'visible' || latestReply === undefined || !onReplyViewed) return;
      const messages = messagesRef.current;
      if (messages) messages.scrollTop = messages.scrollHeight;
      onReplyViewed(latestReply);
    }
    viewReply();
    document.addEventListener('visibilitychange', viewReply);
    return () => document.removeEventListener('visibilitychange', viewReply);
  }, [latestReply, onReplyViewed, thread.isSuccess]);

  const owner = thread.data?.owner_id ?? null;
  const ownedByMe = thread.data?.owned_by_me === true;
  const heldByTeammate = !!owner && !ownedByMe;
  type ThreadAction = CareChatSend | { owner: string | null; release: boolean };

  const action = useMutation({
    mutationFn: async (update?: ThreadAction) => {
      const result = update
        ? 'release' in update ? await assign?.(update.owner, update.release) : await send(update)
        : await close?.();
      if (!result) throw Error('The conversation has expired.');
      return result;
    },
    onSuccess: async (result, update) => {
      await cache.cancelQueries({ queryKey, exact: true });
      cache.setQueryData(queryKey, result);
      if (update && 'message_key' in update) {
        setDraft('');
        setBookingCategory('');
        retry.current = null;
      }
      setConfirmClose(false);
      setConfirmTakeover(null);
      onChange?.();
    },
    onError: error => {
      if ('code' in error && error.code === '55006') void thread.refetch();
    },
    onSettled: () => { lock.current = false; },
  });

  function perform(update?: ThreadAction) {
    if (lock.current) return;
    lock.current = true;
    action.mutate(update);
  }

  const canSend = thread.isSuccess && !thread.data?.closed && !heldByTeammate && (!close || !!thread.data);
  const code = action.error && 'code' in action.error ? action.error.code : undefined;

  return (
    <div className="space-y-4">
      {thread.isPending && <p role="status">Opening chat…</p>}
      {thread.isError && <p role="alert">Could not load this chat. <Button variant="link" onClick={() => void thread.refetch()}>Retry</Button></p>}
      {thread.isSuccess && (
        <ol ref={messagesRef} aria-label="Messages" className="max-h-96 space-y-3 overflow-y-auto rounded-lg border p-4" aria-live="polite" aria-relevant="additions">
          {!thread.data?.messages.length && <li className="text-muted-foreground">{close ? 'This chat is no longer available.' : 'Send a message to start.'}</li>}
          {thread.data?.messages.map(message => {
            const booking = message.sender === 'team'
              ? careSearchCategories.find(([value]) => value === message.booking_category)
              : undefined;
            return (
              <li key={message.id} className="rounded-md bg-muted p-3">
                <p className="text-sm font-semibold">{message.sender === 'team' ? 'Care team' : close ? 'Visitor' : 'You'}</p>
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                {booking && (
                  <Button asChild size="sm" variant="outline" className="mt-2">
                    <Link to={careSearchLink(booking[0], '')}>Browse {booking[1].toLowerCase()}</Link>
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {thread.data?.closed && <p role="status">This chat is closed.</p>}
      {assign && thread.isSuccess && thread.data && !thread.data.closed && (
        <div className="space-y-2 rounded-lg border p-3">
          <p role="status">{ownedByMe ? 'Assigned to you.' : heldByTeammate ? 'Assigned to another staff member.' : 'Unassigned chat.'}</p>
          {heldByTeammate && confirmTakeover === owner ? (
            <div className="flex flex-wrap items-center gap-2">
              <p>Take over this conversation?</p>
              <Button size="sm" disabled={action.isPending} onClick={() => perform({ owner, release: false })}>Confirm takeover</Button>
              <Button size="sm" variant="ghost" disabled={action.isPending} onClick={() => setConfirmTakeover(null)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" disabled={action.isPending} onClick={() => {
              if (heldByTeammate) setConfirmTakeover(owner);
              else perform({ owner, release: ownedByMe });
            }}>{ownedByMe ? 'Release chat' : heldByTeammate ? 'Take over chat' : 'Take chat'}</Button>
          )}
        </div>
      )}
      {canSend && (
        <form className="space-y-3" onSubmit={event => {
          event.preventDefault();
          const body = draft.trim();
          if (!body || lock.current) return;
          const category = bookingCategory || undefined;
          if (retry.current?.message_body !== body || retry.current.booking_category !== category) {
            retry.current = { message_key: crypto.randomUUID(), message_body: body, booking_category: category };
          }
          perform(retry.current);
        }}>
          <Label htmlFor={inputId}>{close ? 'Reply' : 'Your message'}</Label>
          <Textarea id={inputId} maxLength={2000} rows={3} required value={draft} disabled={action.isPending}
            onChange={event => setDraft(event.target.value)} />
          {close && (
            <div className="space-y-2">
              <Label htmlFor={bookingId}>Booking link (optional)</Label>
              <select id={bookingId} value={bookingCategory} disabled={action.isPending}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                onChange={event => setBookingCategory(event.target.value as typeof bookingCategory)}>
                <option value="">No booking link</option>
                {careSearchCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button disabled={!draft.trim() || action.isPending}>Send message</Button>
            {close && <Button type="button" variant="outline" disabled={action.isPending || !!draft.trim()}
              onClick={() => {
                setDraft('Use the booking link below to browse providers and check availability.');
                setBookingCategory(current => current || 'all');
              }}>Use booking reply</Button>}
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
          : code === '55006' ? 'Chat ownership changed. Check the assignment and try again.'
          : 'Could not confirm the update. Try again.'}
      </p>}
    </div>
  );
}
