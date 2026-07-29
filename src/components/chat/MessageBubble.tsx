import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  consultation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const senderName = message.sender
    ? `${message.sender.first_name} ${message.sender.last_name}`
    : 'Unknown';

  const initials = message.sender
    ? `${message.sender.first_name[0]}${message.sender.last_name[0]}`.toUpperCase()
    : 'U';

  return (
    <div
      className={cn('flex gap-3 max-w-[85%]', isOwn ? 'ml-auto flex-row-reverse' : '')}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={message.sender?.avatar_url || undefined} alt={senderName} />
        <AvatarFallback className={cn(
          'text-xs font-semibold',
          isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        <span className="text-xs text-muted-foreground mb-1">{senderName}</span>
        <div
          className={cn(
            'rounded-2xl px-4 py-2 break-words',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {format(new Date(message.created_at), 'h:mm a')}
        </span>
      </div>
    </div>
  );
}
