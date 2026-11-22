import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageTranscript } from './MessageTranscript';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { useAuth } from '@/lib/auth-context';

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

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatWindow({
  messages,
  loading,
  error,
  onRetry,
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
}: ChatWindowProps) {
  const { profile } = useAuth();
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {loading ? (
        <p role="status" className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />Loading conversation…
        </p>
      ) : error ? (
        <div className="rounded-xl border bg-card p-4">
          <p role="alert" className="text-sm">Could not load this conversation.</p>
          {onRetry && <Button type="button" variant="link" onClick={onRetry}>Retry messages</Button>}
        </div>
      ) : (
        <MessageTranscript label="Consultation messages" lastId={messages.at(-1)?.id}
          empty="No messages yet." className="min-h-32 max-h-[min(55dvh,36rem)] flex-1">
          {messages.map(message => (
            <MessageBubble key={message.id} message={message} isOwn={message.sender_id === profile?.id} />
          ))}
        </MessageTranscript>
      )}
      <ChatInput onSend={onSendMessage} disabled={disabled || loading || error} placeholder={placeholder} />
    </div>
  );
}
