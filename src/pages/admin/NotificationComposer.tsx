import { useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { PageHeading } from '@/components/layout/PageHeading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

type Broadcast = { id: string; title: string; message: string };

export default function NotificationComposer() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState<Broadcast | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const sendingLock = useRef(false);
  const cache = useQueryClient();

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSentCount(null);
    setDraft({ id: crypto.randomUUID(), title: title.trim(), message: message.trim() });
  }

  async function send() {
    if (!draft || sendingLock.current) return;
    sendingLock.current = true;
    setSending(true);
    setFailed(false);
    try {
      const { data, error } = await supabase.rpc('send_admin_notification', {
        request_id: draft.id, notification_title: draft.title, notification_message: draft.message,
      });
      if (error || typeof data !== 'number') throw new Error('Broadcast outcome unavailable');
      setSentCount(data);
      setDraft(null);
      setTitle('');
      setMessage('');
      void cache.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      setFailed(true);
    } finally {
      sendingLock.current = false;
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container-wide max-w-3xl space-y-6 pb-20 pt-28">
        <Link to="/admin" className="text-sm text-primary underline">Back to admin dashboard</Link>
        <PageHeading size="workspace" title="Send a notification"
          description="Send an announcement to the notification bell of every active 1Vet account." />
        {sentCount !== null && <p role="status">Notification sent to {sentCount.toLocaleString()} {sentCount === 1 ? 'account' : 'accounts'}.</p>}
        {draft ? (
          <section className="space-y-4 rounded-xl border bg-card p-5" aria-labelledby="notification-review">
            <h2 id="notification-review" className="text-lg font-semibold">Review notification</h2>
            <div className="space-y-2 rounded-lg border bg-background p-4 [overflow-wrap:anywhere]">
              <p className="font-semibold">{draft.title}</p>
              <p className="whitespace-pre-wrap">{draft.message}</p>
            </div>
            <p className="text-sm text-muted-foreground">This will appear in the notification bell for all active accounts.</p>
            {failed && <p role="alert" className="text-sm text-destructive">Could not confirm delivery. Retry this notification to check or complete the send.</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void send()} disabled={sending}>{sending ? 'Sending…' : failed ? 'Retry send' : 'Send to all active accounts'}</Button>
              <Button type="button" variant="outline" disabled={sending || failed} onClick={() => setDraft(null)}>Edit draft</Button>
            </div>
          </section>
        ) : (
          <form onSubmit={review} className="space-y-4 rounded-xl border bg-card p-5">
            <div className="space-y-2">
              <Label htmlFor="notification-title">Title</Label>
              <Input id="notification-title" required maxLength={100} value={title} onChange={event => setTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-message">Message</Label>
              <Textarea id="notification-message" required maxLength={1000} rows={6}
                value={message} onChange={event => setMessage(event.target.value)} />
            </div>
            <Button type="submit" disabled={!title.trim() || !message.trim()}>Review notification</Button>
          </form>
        )}
      </main>
    </div>
  );
}
