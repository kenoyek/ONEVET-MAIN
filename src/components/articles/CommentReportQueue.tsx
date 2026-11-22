import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import {
  listCommentReviews, listReportedComments, reportReasons, resolveCommentReports, type ReportedComment,
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
          <DialogDescription>Review open reports and see past decisions.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="open">
          <TabsList aria-label="Comment reports">
            <TabsTrigger value="open">Open reports</TabsTrigger>
            <TabsTrigger value="history">Review history</TabsTrigger>
          </TabsList>
          <TabsContent value="open"><Queue userId={user.id} /></TabsContent>
          <TabsContent value="history"><ReviewHistory userId={user.id} /></TabsContent>
        </Tabs>
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
        cache.invalidateQueries({ queryKey: ['article-comment-reviews', userId] }),
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
      <p className="text-sm text-muted-foreground">Up to 50 reported comments, oldest reports first.</p>
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

const reviewDate = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Lagos',
});

function ReviewHistory({ userId }: { userId: string }) {
  const [cursors, setCursors] = useState<number[]>([]);
  const before = cursors.at(-1);
  const history = useQuery({
    queryKey: ['article-comment-reviews', userId, before],
    queryFn: () => listCommentReviews(before),
  });
  const lastReview = history.data?.reviews.at(-1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={history.isFetching}
          onClick={() => void history.refetch()}>Refresh history</Button>
        {cursors.length > 0 && (
          <Button variant="outline" size="sm"
            onClick={() => setCursors(previous => previous.slice(0, -1))}>Newer decisions</Button>
        )}
      </div>
      {history.isPending && <p role="status">Loading review history…</p>}
      {history.isError && <p role="alert">Could not load review history. Try refreshing.</p>}
      {history.isSuccess && history.data.reviews.length === 0 && <p>No recorded decisions on this page.</p>}
      {history.isSuccess && history.data.reviews.length > 0 && (
        <ul className="space-y-3" aria-label="Review decisions">
          {history.data.reviews.map(review => (
            <li key={review.id} className="space-y-1 rounded-lg border p-4">
              <h3 className="break-words font-semibold">{review.article_title}</h3>
              <p>{review.action === 'removed' ? 'Comment removed' : 'Reports dismissed'}</p>
              <p className="break-words text-sm text-muted-foreground">
                {review.moderator_name} · {review.report_count} {review.report_count === 1 ? 'report' : 'reports'}
              </p>
              <time className="text-sm text-muted-foreground" dateTime={review.reviewed_at}>
                {reviewDate.format(new Date(review.reviewed_at))} WAT
              </time>
            </li>
          ))}
        </ul>
      )}
      {history.data?.hasOlder && lastReview && (
        <Button variant="outline" size="sm" disabled={history.isFetching}
          onClick={() => setCursors(previous => [...previous, lastReview.id])}>Older decisions</Button>
      )}
    </div>
  );
}
