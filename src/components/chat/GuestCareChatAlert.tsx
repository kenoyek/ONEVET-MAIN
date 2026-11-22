import { useQuery } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getCareChatKey, lastViewedCareChatReply } from '@/lib/care-chat-session';
import { hasCareChatReply } from '@/lib/services/care-chat-service';

export function GuestCareChatAlert() {
  const { pathname } = useLocation();
  const key = getCareChatKey();
  if (!key || pathname.replace(/\/+$/, '').toLowerCase() === '/care-chat') return null;
  return <ReplyAlert guestKey={key} after={lastViewedCareChatReply(key)} />;
}

function ReplyAlert({ guestKey, after }: { guestKey: string; after: number }) {
  const reply = useQuery({
    queryKey: ['care-chat', 'guest-reply', guestKey, after],
    queryFn: () => hasCareChatReply(guestKey, after),
    refetchInterval: 15000,
    retry: false,
  });

  return (
    <span role="status" className="shrink-0">
      {reply.isSuccess && reply.data && (
        <Button asChild size="icon" variant="outline" className="relative">
          <Link to="/care-chat" aria-label="New reply from the care team" title="New reply from the care team">
            <MessageCircle className="size-5" aria-hidden="true" />
            <span aria-hidden="true" className="absolute right-1 top-1 size-2 rounded-full bg-primary" />
            <span className="sr-only">New reply from the care team</span>
          </Link>
        </Button>
      )}
    </span>
  );
}
