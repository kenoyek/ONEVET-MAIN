import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminMessageNav } from '@/components/admin/AdminMessageNav';
import { Navbar } from '@/components/layout/Navbar';
import { PageHeading } from '@/components/layout/PageHeading';
import { StaffChatAvailability } from '@/components/chat/CareChatAvailability';
import { CareChatThread } from '@/components/chat/CareChatThread';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  assignCareChat, careChatWaitingKey, listCareChats, staffCareChat, type CareChatInboxAssignment, type CareChatInboxCursor, type CareChatInboxFilter, type CareChatInboxItem,
} from '@/lib/services/care-chat-service';

export default function CareChatInbox() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const assignment = params.get('assignment');
  const initialAssignment = assignment === 'mine' || assignment === 'unassigned' ? assignment : 'all';
  return user ? <Inbox key={`${user.id}:${initialAssignment}`} userId={user.id} initialAssignment={initialAssignment} /> : null;
}

const filterLabels = {
  waiting: 'Awaiting reply',
  replied: 'Replied',
  closed: 'Closed',
} satisfies Record<CareChatInboxFilter, string>;

const assignmentOptions = {
  all: 'All assignments',
  mine: 'Assigned to me',
  unassigned: 'Unassigned',
} satisfies Record<CareChatInboxAssignment, string>;

const assignmentLabels = {
  mine: 'Assigned to you',
  teammate: 'Assigned to a teammate',
  unassigned: 'Unassigned',
} satisfies Record<CareChatInboxItem['assignment'], string>;

const timestamp = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Lagos',
});

function Inbox({ userId, initialAssignment }: { userId: string; initialAssignment: CareChatInboxAssignment }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<CareChatInboxFilter>('waiting');
  const [assignment, setAssignment] = useState(initialAssignment);
  const [cursors, setCursors] = useState<CareChatInboxCursor[]>([]);
  const cursor = cursors.at(-1);
  const cache = useQueryClient();
  const inboxKey = ['care-chat', 'inbox', userId];
  const inbox = useQuery({
    queryKey: [...inboxKey, filter, assignment, cursor],
    queryFn: () => listCareChats(filter, assignment, cursor),
    refetchInterval: 5000,
    retry: false,
  });
  const lastItem = inbox.data?.items.at(-1);
  const showChat = Boolean(selected && inbox.isSuccess);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container-wide space-y-6 pb-24 pt-28 md:pb-16">
        <AdminMessageNav />
        <PageHeading title="Care chat inbox" description="Reply to general care and booking questions." />
        <StaffChatAvailability userId={userId} />
        <div className="grid gap-4 md:grid-cols-[minmax(14rem,1fr)_minmax(0,2fr)]">
          <div className={`min-w-0 space-y-3 ${showChat ? 'hidden md:block' : ''}`}>
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
            <Label htmlFor="care-inbox-assignment">Assignment</Label>
            <select id="care-inbox-assignment" value={assignment}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              onChange={event => {
                setAssignment(event.target.value as CareChatInboxAssignment);
                setCursors([]);
                setSelected(null);
              }}>
              {Object.entries(assignmentOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {filter === 'waiting' && <p className="text-sm text-muted-foreground">Longest waiting chats first.</p>}
            {inbox.isPending && <p role="status">Loading chats…</p>}
            {inbox.isError && <p role="alert">Could not load chats. <Button variant="link" onClick={() => void inbox.refetch()}>Retry</Button></p>}
            {inbox.isSuccess && inbox.data.items.length === 0 && (
              <p>{filter === 'waiting' && !cursor && assignment === 'all'
                ? 'No chats awaiting a reply.' : 'No chats match these filters on this page.'}</p>
            )}
            {inbox.isSuccess && inbox.data.items.length > 0 && (
              <ul className="max-h-[32rem] space-y-2 overflow-y-auto" aria-label="Guest conversations">
                {inbox.data.items.map(item => (
                  <li key={item.id}>
                    <Button variant={selected === item.id ? 'secondary' : 'outline'} aria-pressed={selected === item.id}
                      className="h-auto w-full flex-col items-start gap-1 p-3 text-left" onClick={() => setSelected(item.id)}>
                      <span className="max-w-full truncate">{item.preview}</span>
                      <span className="text-xs font-normal text-muted-foreground">{assignmentLabels[item.assignment]}</span>
                      <time className="text-xs font-normal text-muted-foreground" dateTime={item.queue_at}>
                        {filter === 'waiting' ? 'Waiting since ' : 'Updated '}{timestamp.format(new Date(item.queue_at))} WAT
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
                  onClick={() => setCursors(previous => [...previous, { id: lastItem.id, queue_at: lastItem.queue_at }])}>
                  Next page
                </Button>
              )}
            </div>
          </div>
          {selected && inbox.isSuccess && (
            <section aria-label="Selected care chat" className="min-w-0 space-y-3 rounded-xl border bg-card p-3 sm:p-4">
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelected(null)}>Back to chats</Button>
              <h2 className="text-base font-semibold">Conversation</h2>
              <CareChatThread key={selected} queryKey={['care-chat', 'staff', userId, selected]}
                load={() => staffCareChat(selected)}
                send={message => staffCareChat(selected, message)}
                close={() => staffCareChat(selected, undefined, true)}
                assign={(owner, release) => assignCareChat(selected, owner, release)}
                onChange={() => {
                  void cache.invalidateQueries({ queryKey: inboxKey });
                  void cache.invalidateQueries({ queryKey: careChatWaitingKey(userId) });
                }} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
