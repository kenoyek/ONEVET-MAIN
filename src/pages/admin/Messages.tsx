import { useQuery } from '@tanstack/react-query';
import { AdminMessageNav, AdminMessageChannels } from '@/components/admin/AdminMessageNav';
import { Navbar } from '@/components/layout/Navbar';
import { PageHeading } from '@/components/layout/PageHeading';
import { useAuth } from '@/lib/auth-context';
import { careChatWaitingKey, countWaitingCareChats } from '@/lib/services/care-chat-service';
import { getSupportInboxTotals, supportInboxKey } from '@/lib/services/support-inbox-service';

export default function AdminMessages() {
  const { user } = useAuth();
  return user ? <MessagingOverview key={user.id} userId={user.id} /> : null;
}

function MessagingOverview({ userId }: { userId: string }) {
  const chats = useQuery({
    queryKey: careChatWaitingKey(userId),
    queryFn: countWaitingCareChats,
    refetchInterval: 15000,
    retry: false,
  });
  const support = useQuery({
    queryKey: [...supportInboxKey(userId), 'totals'],
    queryFn: getSupportInboxTotals,
    refetchInterval: 30000,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container-wide space-y-6 pb-24 pt-24 md:pt-28">
        <AdminMessageNav />
        <PageHeading size="workspace" title="Messages" />
        <AdminMessageChannels
          careStatus={chats.isSuccess ? `${chats.data.toLocaleString('en-NG')} awaiting reply` : 'Awaiting reply'}
          openSupport={support.isSuccess ? `${support.data.open.toLocaleString('en-NG')} open` : 'Open requests'}
          unreadSupport={support.isSuccess ? `${support.data.unread.toLocaleString('en-NG')} unread` : 'Unread requests'} />
        {(chats.isError || support.isError) && (
          <p role="status" className="text-sm text-muted-foreground">Some queue counts are unavailable.</p>
        )}
      </main>
    </div>
  );
}
