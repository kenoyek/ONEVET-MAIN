import { useId, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addSupportMessageNote, listSupportMessageNotes } from '@/lib/services/support-inbox-service';

const noteLimit = 1000;
const timestamp = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Lagos',
});

export function SupportMessageNotes({ messageId, userId }: { messageId: string; userId: string }) {
  const noteId = useId();
  const cache = useQueryClient();
  const [draft, setDraft] = useState('');
  const [cursors, setCursors] = useState<number[]>([]);
  const retry = useRef<{ id: string; body: string } | null>(null);
  const lock = useRef(false);
  const before = cursors.at(-1);
  const notesKey = ['support-message-notes', userId, messageId];
  const records = useQuery({
    queryKey: [...notesKey, before],
    queryFn: () => listSupportMessageNotes(messageId, before),
    refetchInterval: 30000,
    retry: false,
  });
  const lastNote = records.data?.notes.at(-1);
  const save = useMutation({
    mutationFn: ({ id, body }: NonNullable<typeof retry.current>) => addSupportMessageNote(messageId, id, body),
    onSuccess: async () => {
      setDraft('');
      retry.current = null;
      setCursors([]);
      await cache.invalidateQueries({ queryKey: notesKey });
    },
    onSettled: () => { lock.current = false; },
  });

  return (
    <section className="space-y-3 border-t pt-4" aria-label="Private notes">
      <h3 className="font-semibold">Private notes</h3>
      <p className="text-sm text-muted-foreground">Only admins can see these notes.</p>
      {records.isPending && <p role="status">Loading notes…</p>}
      {records.isError && <p role="alert">Could not load notes. <Button variant="link" onClick={() => void records.refetch()}>Retry</Button></p>}
      {records.isSuccess && records.data.notes.length === 0 && <p>No notes on this page.</p>}
      {records.isSuccess && records.data.notes.length > 0 && (
        <ul className="space-y-2" aria-label="Saved notes">
          {records.data.notes.map(note => (
            <li key={note.id} className="space-y-1 rounded-md bg-muted p-3">
              <p className="break-words text-sm font-semibold">{note.author_name}</p>
              <time className="text-xs text-muted-foreground" dateTime={note.created_at}>
                {timestamp.format(new Date(note.created_at))} WAT
              </time>
              <p className="whitespace-pre-wrap break-words">{note.body}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        {before !== undefined && <Button size="sm" variant="outline"
          onClick={() => setCursors(previous => previous.slice(0, -1))}>Newer notes</Button>}
        {records.isSuccess && records.data.hasMore && lastNote && (
          <Button size="sm" variant="outline" disabled={records.isFetching}
            onClick={() => setCursors(previous => [...previous, lastNote.id])}>Older notes</Button>
        )}
      </div>
      <form className="space-y-2" onSubmit={event => {
        event.preventDefault();
        const body = draft.trim();
        if (!records.isSuccess || !body || body.length > noteLimit || lock.current) return;
        if (retry.current?.body !== body) retry.current = { id: crypto.randomUUID(), body };
        lock.current = true;
        save.mutate(retry.current);
      }}>
        <Label htmlFor={noteId}>Add a private note</Label>
        <Textarea id={noteId} value={draft} maxLength={noteLimit} rows={3} disabled={save.isPending}
          onChange={event => setDraft(event.target.value)} />
        <Button type="submit" size="sm" disabled={!records.isSuccess || !draft.trim() || save.isPending}>Save note</Button>
        {save.isError && <p role="alert" className="text-sm text-destructive">Could not confirm the note was saved. Your draft is still here.</p>}
      </form>
    </section>
  );
}
