import { useQuery } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { careChatWaitingKey, countWaitingCareChats } from '@/lib/services/care-chat-service';

export function CareChatAlert({ userId }: { userId: string }) {
  const waiting = useQuery({
    queryKey: careChatWaitingKey(userId),
    queryFn: countWaitingCareChats,
    refetchInterval: 15000,
    retry: false,
  });
  const count = waiting.isSuccess ? waiting.data : 0;
  const label = count > 0
    ? `Care chat inbox, ${count} ${count === 1 ? 'chat' : 'chats'} awaiting a reply`
    : 'Care chat inbox';

  return (
    <Button asChild variant="ghost" size="icon" className="relative shrink-0">
      <Link to="/admin/care-chat" aria-label={label} title={label}>
        <MessageCircle className="size-5" aria-hidden="true" />
        {count > 0 && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1 text-center text-[10px] leading-5 text-primary-foreground">
            {count > 99 ? '99+' : count}
          </span>
        )}
        <span role="status" className="sr-only">{count > 0 ? label : ''}</span>
      </Link>
    </Button>
  );
}
