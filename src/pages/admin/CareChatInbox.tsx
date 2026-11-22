import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { PageHeading } from '@/components/layout/PageHeading';
import { StaffChatAvailability } from '@/components/chat/CareChatAvailability';
import { CareChatThread } from '@/components/chat/CareChatThread';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  assignCareChat, careChatWaitingKey, listCareChats, staffCareChat, type CareChatInboxCursor, type CareChatInboxFilter,
} from '@/lib/services/care-chat-service';

export default function CareChatInbox() {
  const { user } = useAuth();
  return user ? <Inbox key={user.id} userId={user.id} /> : null;
}

const filterLabels = {
  waiting: 'Awaiting reply',
  replied: 'Replied',
  closed: 'Closed',
} satisfies Record<CareChatInboxFilter, string>;

const timestamp = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Lagos',
});

function Inbox({ userId }: { userId: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<CareChatInboxFilter>('waiting');
  const [cursors, setCursors] = useState<CareChatInboxCursor[]>([]);
  const cursor = cursors.at(-1);
  const cache = useQueryClient();
  const inboxKey = ['care-chat', 'inbox', userId];
  const inbox = useQuery({
    queryKey: [...inboxKey, filter, cursor],
    queryFn: () => listCareChats(filter, cursor),
    refetchInterval: 5000,
    retry: false,
  });
  const lastItem = inbox.data?.items.at(-1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container-wide space-y-6 pb-16 pt-28">
        <Button asChild variant="ghost"><Link to="/admin">Back to admin</Link></Button>
        <PageHeading title="Care chat inbox" description="Reply to general care and booking questions." />
        <StaffChatAvailability userId={userId} />
        <div className="grid gap-4 md:grid-cols-[minmax(14rem,1fr)_minmax(0,2fr)]">
          <div className="min-w-0 space-y-3">
            <Label htmlFor="care-inbox-filter">Chat status</Label>
            <select id="care-inbox-filter" value={filter}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              onChange={event => {
                setFilter(event.target.value as CareChatInboxFilter);
                setCursors([]);
                setSelected(null);
              }}>
              {Object.entries(filterLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {filter === 'waiting' && <p className="text-sm text-muted-foreground">Oldest waiting messages first.</p>}
            {inbox.isPending && <p role="status">Loading chats…</p>}
            {inbox.isError && <p role="alert">Could not load chats. <Button variant="link" onClick={() => void inbox.refetch()}>Retry</Button></p>}
            {inbox.isSuccess && inbox.data.items.length === 0 && (
              <p>{filter === 'waiting' && !cursor ? 'No chats awaiting a reply.' : 'No chats on this page.'}</p>
            )}
            {inbox.isSuccess && inbox.data.items.length > 0 && (
              <ul className="max-h-[32rem] space-y-2 overflow-y-auto" aria-label="Guest conversations">
                {inbox.data.items.map(item => (
                  <li key={item.id}>
                    <Button variant={selected === item.id ? 'secondary' : 'outline'} aria-pressed={selected === item.id}
                      className="h-auto w-full flex-col items-start gap-1 p-3 text-left" onClick={() => setSelected(item.id)}>
                      <span className="max-w-full truncate">{item.preview}</span>
                      <time className="text-xs font-normal text-muted-foreground" dateTime={item.updated_at}>
                        {timestamp.format(new Date(item.updated_at))} WAT
                      </time>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              {cursors.length > 0 && <Button size="sm" variant="outline"
                onClick={() => setCursors(previous => previous.slice(0, -1))}>Previous page</Button>}
              {inbox.isSuccess && inbox.data.hasMore && lastItem && (
                <Button size="sm" variant="outline" disabled={inbox.isFetching}
                  onClick={() => setCursors(previous => [...previous, { id: lastItem.id, updated_at: lastItem.updated_at }])}>
                  Next page
                </Button>
              )}
            </div>
          </div>
          {selected && inbox.isSuccess && (
            <CareChatThread key={selected} queryKey={['care-chat', 'staff', userId, selected]}
              load={() => staffCareChat(selected)}
              send={message => staffCareChat(selected, message)}
              close={() => staffCareChat(selected, undefined, true)}
              assign={(owner, release) => assignCareChat(selected, owner, release)}
              onChange={() => {
                void cache.invalidateQueries({ queryKey: inboxKey });
                void cache.invalidateQueries({ queryKey: careChatWaitingKey(userId) });
              }} />
          )}
        </div>
      </main>
    </div>
  );
}
