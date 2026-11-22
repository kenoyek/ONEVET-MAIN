import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageItem } from './MessageTranscript';

interface Message {
  id: string;
  consultation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean | null;
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
  const name = [message.sender?.first_name, message.sender?.last_name].filter(Boolean).join(' ');

  return (
    <MessageItem sender={isOwn ? 'You' : name || 'Participant'} body={message.content}
      sentAt={message.created_at} own={isOwn}
      avatar={(
        <Avatar className="size-7 shrink-0 sm:size-8" aria-hidden="true">
          <AvatarImage src={message.sender?.avatar_url || undefined} alt="" />
          <AvatarFallback className="text-xs">
            {name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'P'}
          </AvatarFallback>
        </Avatar>
      )} />
  );
}
