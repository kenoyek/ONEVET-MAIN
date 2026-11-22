import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SupportMessageNotes } from '@/components/support/SupportMessageNotes';
import { Navbar } from '@/components/layout/Navbar';
import { PageHeading } from '@/components/layout/PageHeading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import {
  MAX_SUPPORT_SEARCH_LENGTH, getSupportInboxTotals, listSupportMessages, markSupportMessageRead, setSupportMessageResolved,
  type SupportMessage, type SupportMessageCursor, type SupportMessageFilter,
} from '@/lib/services/support-inbox-service';

const receivedAt = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Lagos',
});

export default function SupportInbox() {
  const { user } = useAuth();
  return user ? <Inbox key={user.id} userId={user.id} /> : null;
}

function Inbox({ userId }: { userId: string }) {
  const [filter, setFilter] = useState<SupportMessageFilter>('open');
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SupportMessage | null>(null);
  const [cursors, setCursors] = useState<SupportMessageCursor[]>([]);
  const cursor = cursors.at(-1);
  const cache = useQueryClient();
  const inboxKey = ['support-inbox', userId];
  const inbox = useQuery({
    queryKey: [...inboxKey, filter, search, cursor],
    queryFn: () => listSupportMessages(filter, search, cursor),
    refetchInterval: 30000,
    retry: false,
  });
  const totals = useQuery({
    queryKey: [...inboxKey, 'totals'],
    queryFn: getSupportInboxTotals,
    refetchInterval: 30000,
    retry: false,
  });
  const changeStatus = useMutation({
    mutationFn: async ({ message, action }: { message: SupportMessage; action: 'read' | 'resolution' }) => {
      if (action === 'resolution') {
        return { resolved_at: await setSupportMessageResolved(message.id, !message.resolved_at) };
      }
      await markSupportMessageRead(message.id, !message.is_read);
      return { is_read: !message.is_read };
    },
    onSuccess: async (updated, { message }) => {
      setSelected(previous => previous?.id === message.id ? { ...previous, ...updated } : previous);
      await cache.invalidateQueries({ queryKey: inboxKey });
    },
  });

  const detail = inbox.data?.records.find(message => message.id === selected?.id) ?? selected;
  const last = inbox.data?.records.at(-1);

  function resetView() {
    setCursors([]);
    setSelected(null);
    changeStatus.reset();
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container-wide space-y-6 pb-24 pt-28">
        <Button asChild variant="ghost"><Link to="/admin">Back to admin</Link></Button>
        <PageHeading title="Support inbox" description="Review submissions from the Contact form. Read and resolution status are shared with other admins." />
        <section aria-label="Inbox totals" className="space-y-2">
          <h2 className="text-sm font-semibold">Inbox totals</h2>
          {totals.isPending && <p role="status" className="text-sm text-muted-foreground">Loading inbox totals…</p>}
          {totals.isError && <p role="status" className="text-sm text-muted-foreground">Inbox totals are unavailable.</p>}
          {totals.isSuccess && (
            <dl className="grid grid-cols-3 gap-2 sm:gap-4">
              {([
                ['Open', totals.data.open],
                ['Unread', totals.data.unread],
                ['Resolved', totals.data.resolved],
              ] as const).map(([label, count]) => (
                <div key={label} className="space-y-1 rounded-lg border bg-card p-3 sm:p-4">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-xl font-semibold tabular-nums sm:text-2xl">{count.toLocaleString('en-NG')}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
        <div className="grid gap-5 md:grid-cols-[minmax(14rem,1fr)_minmax(0,2fr)]">
          <section aria-label="Support messages" className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="support-message-filter">Messages</Label>
                <select id="support-message-filter" value={filter}
                  className="block h-10 rounded-md border bg-background px-3 text-sm"
                  onChange={event => {
                    setFilter(event.target.value as SupportMessageFilter);
                    resetView();
                  }}>
                  <option value="open">Open</option>
                  <option value="unread">Unread</option>
                  <option value="resolved">Resolved</option>
                  <option value="all">All messages</option>
                </select>
              </div>
              <Button variant="outline" disabled={inbox.isFetching || totals.isFetching}
                onClick={() => void Promise.all([inbox.refetch(), totals.refetch()])}>Refresh</Button>
            </div>
            <form className="space-y-2" onSubmit={event => {
              event.preventDefault();
              setSearch(draft.trim());
              resetView();
            }}>
              <Label htmlFor="support-message-search">Search messages</Label>
              <Input id="support-message-search" type="search" placeholder="Name, email, or subject"
                value={draft} maxLength={MAX_SUPPORT_SEARCH_LENGTH}
                onChange={event => setDraft(event.target.value)} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" type="submit">Search</Button>
                {(search || draft) && <Button size="sm" type="button" variant="ghost" onClick={() => {
                  setDraft('');
                  setSearch('');
                  resetView();
                }}>Clear search</Button>}
              </div>
            </form>
            {inbox.isPending && <p role="status">Loading support messages…</p>}
            {inbox.isError && <p role="alert">Could not load support messages. Try refreshing.</p>}
            {inbox.isSuccess && inbox.data.records.length === 0 && (
              <p>{search && !cursor ? 'No messages match this search.'
                : cursor || filter === 'all' ? 'No messages on this page.' : `No ${filter} messages.`}</p>
            )}
            {inbox.isSuccess && inbox.data.records.length > 0 && (
              <ul className="max-h-[30rem] space-y-2 overflow-y-auto" aria-label="Contact form submissions">
                {inbox.data.records.map(message => (
                  <li key={message.id}>
                    <Button variant={detail?.id === message.id ? 'secondary' : 'outline'} aria-pressed={detail?.id === message.id}
                      className="h-auto w-full flex-col items-start gap-1 p-3 text-left"
                      onClick={() => {
                        setSelected(message);
                        changeStatus.reset();
                      }}>
                      <span className="max-w-full truncate">{message.subject}</span>
                      <span className="max-w-full truncate text-xs font-normal text-muted-foreground">
                        {message.name} · {message.resolved_at ? 'Resolved' : 'Open'} · {message.is_read ? 'Read' : 'Unread'}
                      </span>
                      <time dateTime={message.created_at} className="text-xs font-normal text-muted-foreground">
                        {receivedAt.format(new Date(message.created_at))} WAT
                      </time>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              {cursor && <Button size="sm" variant="outline" onClick={() => setCursors(previous => previous.slice(0, -1))}>Previous page</Button>}
              {inbox.isSuccess && inbox.data.hasMore && last && (
                <Button size="sm" variant="outline" disabled={inbox.isFetching}
                  onClick={() => setCursors(previous => [...previous, { created_at: last.created_at, id: last.id }])}>
                  Next page
                </Button>
              )}
            </div>
          </section>
          {inbox.isSuccess && detail && (
            <article className="min-w-0 space-y-4 rounded-lg border bg-card p-4 sm:p-6" aria-label="Selected support message">
              <header className="space-y-2">
                <h2 className="break-words text-xl font-semibold">{detail.subject}</h2>
                <p className="break-words text-sm text-muted-foreground">{detail.name} · {detail.email}</p>
              </header>
              <p className="whitespace-pre-wrap break-words">{detail.message}</p>
              <p role="status" className="text-sm text-muted-foreground">
                {detail.resolved_at ? `Resolved ${receivedAt.format(new Date(detail.resolved_at))} WAT` : 'Open'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button disabled={changeStatus.isPending}
                  onClick={() => changeStatus.mutate({ message: detail, action: 'resolution' })}>
                  {detail.resolved_at ? 'Reopen' : 'Resolve'}
                </Button>
                <Button variant="outline" disabled={changeStatus.isPending}
                  onClick={() => changeStatus.mutate({ message: detail, action: 'read' })}>
                  {detail.is_read ? 'Mark unread' : 'Mark read'}
                </Button>
              </div>
              {changeStatus.isError && <p role="alert" className="text-sm text-destructive">Could not update message status. Try again.</p>}
              <SupportMessageNotes key={detail.id} messageId={detail.id} userId={userId} />
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
