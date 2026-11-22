import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import {
  listReportedComments, reportReasons, resolveCommentReports, type ReportedComment,
} from '@/lib/services/article-comment-reports';

export function CommentReportQueue() {
  const { user, role } = useAuth();
  if (!user || role !== 'admin') return null;

  return (
    <Dialog key={user.id}>
      <DialogTrigger asChild><Button variant="outline">Comment reports</Button></DialogTrigger>
      <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comment reports</DialogTitle>
          <DialogDescription>Review up to 50 reported comments, oldest reports first.</DialogDescription>
        </DialogHeader>
        <Queue userId={user.id} />
      </DialogContent>
    </Dialog>
  );
}

function Queue({ userId }: { userId: string }) {
  const [selection, setSelection] = useState<{ comment: ReportedComment; remove: boolean } | null>(null);
  const [feedback, setFeedback] = useState('');
  const cache = useQueryClient();
  const queueKey = ['article-comment-reports', userId];
  const queue = useQuery({ queryKey: queueKey, queryFn: listReportedComments });
  const resolve = useMutation({
    mutationFn: ({ comment, remove }: NonNullable<typeof selection>) =>
      resolveCommentReports(comment.comment_id, remove),
    onSuccess: async (_, { comment, remove }) => {
      setSelection(null);
      setFeedback(remove ? 'Comment removed.' : 'Reports dismissed.');
      await Promise.all([
        cache.invalidateQueries({ queryKey: queueKey }),
        cache.invalidateQueries({ queryKey: ['article-engagement', comment.article_id] }),
      ]);
    },
  });

  function select(comment: ReportedComment, remove: boolean) {
    resolve.reset();
    setFeedback('');
    setSelection({ comment, remove });
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" disabled={queue.isFetching || resolve.isPending}
        onClick={() => void queue.refetch()}>Refresh reports</Button>
      {queue.isPending && <p role="status">Loading comment reports…</p>}
      {queue.isError && <p role="alert">Could not load comment reports. Try refreshing.</p>}
      {feedback && <p role="status">{feedback}</p>}
      {queue.isSuccess && queue.data.length === 0 && <p>No open comment reports.</p>}
      {queue.isSuccess && queue.data.length > 0 && (
        <ul className="space-y-3" aria-label="Reported comments">
          {queue.data.map(comment => (
            <li key={comment.comment_id} className="space-y-2 rounded-lg border p-4">
              <h3 className="break-words font-semibold">{comment.article_title}</h3>
              <p className="break-words text-sm text-muted-foreground">
                {comment.author_name} · {comment.report_count} {comment.report_count === 1 ? 'report' : 'reports'} · {comment.reasons.map(reason => reportReasons[reason]).join(', ')}
              </p>
              <p className="whitespace-pre-wrap break-words">{comment.body}</p>
              {selection?.comment.comment_id === comment.comment_id ? (
                <div className="space-y-2">
                  <p>{selection.remove ? 'Permanently remove this comment?' : 'Dismiss all open reports for this comment?'}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant={selection.remove ? 'destructive' : 'default'}
                      disabled={resolve.isPending} onClick={() => resolve.mutate(selection)}>Confirm</Button>
                    <Button size="sm" variant="ghost" disabled={resolve.isPending}
                      onClick={() => setSelection(null)}>Cancel</Button>
                  </div>
                  {resolve.isError && <p role="alert" className="text-destructive">Could not save the decision. Try again.</p>}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={resolve.isPending}
                    onClick={() => select(comment, false)}>Dismiss reports</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" disabled={resolve.isPending}
                    onClick={() => select(comment, true)}>Remove comment</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
