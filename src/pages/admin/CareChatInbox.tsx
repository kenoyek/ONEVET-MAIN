import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { PageHeading } from '@/components/layout/PageHeading';
import { StaffChatAvailability } from '@/components/chat/CareChatAvailability';
import { CareChatThread } from '@/components/chat/CareChatThread';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { listCareChats, staffCareChat } from '@/lib/services/care-chat-service';

export default function CareChatInbox() {
  const { user } = useAuth();
  return user ? <Inbox key={user.id} userId={user.id} /> : null;
}

function Inbox({ userId }: { userId: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const cache = useQueryClient();
  const inboxKey = ['care-chat', 'inbox', userId];
  const inbox = useQuery({ queryKey: inboxKey, queryFn: listCareChats, refetchInterval: 5000, retry: false });
  const active = inbox.isSuccess && inbox.data.some(item => item.id === selected) ? selected : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container-wide space-y-6 pb-16 pt-28">
        <Button asChild variant="ghost"><Link to="/admin">Back to admin</Link></Button>
        <PageHeading title="Care chat inbox" description="Reply to general care and booking questions. Chats waiting for a reply appear first." />
        <StaffChatAvailability userId={userId} />
        {inbox.isPending && <p role="status">Loading chats…</p>}
        {inbox.isError && <p role="alert">Could not load chats. <Button variant="link" onClick={() => void inbox.refetch()}>Retry</Button></p>}
        {inbox.isSuccess && inbox.data.length === 0 && <p>No recent conversations.</p>}
        {inbox.isSuccess && inbox.data.length > 0 && (
          <div className="grid gap-4 md:grid-cols-[minmax(14rem,1fr)_minmax(0,2fr)]">
            <ul className="max-h-[32rem] space-y-2 overflow-y-auto" aria-label="Guest conversations">
              {inbox.data.map(item => (
                <li key={item.id}>
                  <Button variant={active === item.id ? 'secondary' : 'outline'} aria-pressed={active === item.id}
                    className="h-auto w-full flex-col items-start gap-1 p-3 text-left" onClick={() => setSelected(item.id)}>
                    <span>{item.closed ? 'Closed' : item.awaiting_reply ? 'Awaiting reply' : 'Replied'}</span>
                    <span className="max-w-full truncate font-normal">{item.preview}</span>
                  </Button>
                </li>
              ))}
            </ul>
            {active && <CareChatThread key={active} queryKey={['care-chat', 'staff', userId, active]}
              load={() => staffCareChat(active)}
              send={message => staffCareChat(active, message)}
              close={() => staffCareChat(active, undefined, true)}
              onChange={() => void cache.invalidateQueries({ queryKey: inboxKey })} />}
          </div>
        )}
      </main>
    </div>
  );
}
