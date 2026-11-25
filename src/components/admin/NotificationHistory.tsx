import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const pageSize = 10;
const sentDate = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos',
});

export function NotificationHistory({ adminId }: { adminId: string }) {
  const [page, setPage] = useState(0);
  const history = useQuery({
    queryKey: ['admin-notification-history', adminId, page],
    retry: false,
    queryFn: async () => {
      const start = page * pageSize;
      const { data, error } = await supabase.from('audit_logs')
        .select('id,created_at,details')
        .eq('action', 'notification_broadcast_sent')
        .eq('entity_type', 'notification_broadcast')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(start, start + pageSize);

      if (error) throw error;
      return { entries: data.slice(0, pageSize), hasNext: data.length > pageSize };
    },
  });

  return (
    <section className="space-y-4 rounded-xl border bg-card p-5" aria-labelledby="notification-history">
      <h2 id="notification-history" className="text-lg font-semibold">Sent notifications</h2>
      {history.isPending && <p role="status" className="text-sm">Loading sent notifications…</p>}
      {history.isError && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-destructive">Could not load sent notifications.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void history.refetch()}>Retry history</Button>
        </div>
      )}
      {history.isSuccess && (
        history.data.entries.length ? (
          <ul className="divide-y">
            {history.data.entries.map(({ id, created_at, details }) => {
              const fields = details && typeof details === 'object' && !Array.isArray(details) ? details : {};
              return (
                <li key={id} className="py-3 [overflow-wrap:anywhere]">
                  <details>
                    <summary className="cursor-pointer rounded-sm font-medium">
                      {typeof fields.title === 'string' ? fields.title : 'Notification'}
                    </summary>
                    {typeof fields.message === 'string' && <p className="mt-2 whitespace-pre-wrap text-sm">{fields.message}</p>}
                  </details>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                    <time dateTime={created_at}>{sentDate.format(new Date(created_at))} WAT</time>
                    {typeof fields.recipients === 'number' && (
                      <span>{fields.recipients.toLocaleString('en-NG')} {fields.recipients === 1 ? 'recipient' : 'recipients'}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-muted-foreground">{page ? 'No notifications on this page.' : 'No notifications have been sent yet.'}</p>
      )}
      {(page > 0 || history.data?.hasNext) && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Button type="button" variant="outline" size="sm" disabled={page === 0 || history.isFetching}
            onClick={() => setPage(current => current - 1)}>Previous</Button>
          <span>Page {page + 1}</span>
          <Button type="button" variant="outline" size="sm" disabled={!history.data?.hasNext || history.isFetching}
            onClick={() => setPage(current => current + 1)}>Next</Button>
        </div>
      )}
    </section>
  );
}
