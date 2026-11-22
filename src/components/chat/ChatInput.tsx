import { useId, useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder = 'Type your message…' }: ChatInputProps) {
  const inputId = useId();
  const lock = useRef(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleSend() {
    const body = message.trim();
    if (!body || lock.current || disabled) return;
    lock.current = true;
    setSending(true);
    setFailed(false);
    try {
      await onSend(body);
      setMessage('');
    } catch {
      setFailed(true);
    } finally {
      lock.current = false;
      setSending(false);
    }
  }

  return (
    <form className="space-y-2 rounded-xl border bg-card p-3 sm:p-4" onSubmit={event => {
      event.preventDefault();
      void handleSend();
    }}>
      <Label htmlFor={inputId}>Message</Label>
      <div className="flex items-end gap-2">
        <Textarea id={inputId} value={message} onChange={event => setMessage(event.target.value)}
          onKeyDown={event => {
            if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
            event.preventDefault();
            void handleSend();
          }}
          placeholder={placeholder} disabled={disabled || sending}
          className="min-h-11 max-h-32 min-w-0 resize-y" rows={2} />
        <Button type="submit" aria-label={sending ? 'Sending message' : 'Send message'}
          disabled={!message.trim() || sending || disabled} size="icon" className="shrink-0">
          {sending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
        </Button>
      </div>
      {failed && <p role="alert" className="text-sm text-destructive">Could not confirm the message was sent. Your draft is still here.</p>}
      {disabled ? (
        <p className="text-xs text-muted-foreground">Messages can’t be sent right now.</p>
      ) : (
        <p className="hidden text-xs text-muted-foreground sm:block">Enter to send · Shift + Enter for a new line</p>
      )}
    </form>
  );
}
