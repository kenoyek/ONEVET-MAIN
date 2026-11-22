import { useId, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { reportComment, reportReasons, type ReportReason } from '@/lib/services/article-comment-reports';

export function ReportComment({ commentId }: { commentId: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('spam');
  const report = useMutation({ mutationFn: () => reportComment(commentId, reason) });

  if (report.isSuccess) return <p role="status" className="mt-3 text-sm">Report submitted.</p>;
  if (!open) return <Button className="mt-3" variant="ghost" size="sm" onClick={() => setOpen(true)}>Report comment</Button>;

  return (
    <form className="mt-3 flex flex-wrap items-center gap-2" onSubmit={event => {
      event.preventDefault();
      if (!report.isPending) report.mutate();
    }}>
      <Label htmlFor={id}>Reason</Label>
      <select id={id} className="rounded-md border bg-background p-2 text-sm" value={reason}
        disabled={report.isPending} onChange={event => setReason(event.target.value as ReportReason)}>
        {Object.entries(reportReasons).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <Button size="sm" disabled={report.isPending}>Submit report</Button>
      <Button type="button" variant="ghost" size="sm" disabled={report.isPending} onClick={() => {
        report.reset();
        setOpen(false);
      }}>Cancel</Button>
      {report.isError && <p role="alert" className="w-full text-sm text-destructive">Could not submit the report. Try again.</p>}
    </form>
  );
}
