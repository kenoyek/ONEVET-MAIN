import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProviderVerificationHistory } from '@/components/provider/ProviderVerificationHistory';
import { ProviderEvidenceList } from '@/components/provider/ProviderEvidenceList';
import { useAuth } from '@/lib/auth-context';
import { providerVerificationService as service, verificationError, type ReviewDecision } from '@/lib/services/provider-verification-service';
const filters = { pending: ['submitted', 'under_review'], returned: ['more_info_required', 'rejected'], approved: ['approved'], suspended: ['suspended'] };
function ApplicationReview({ providerId }: { providerId: string }) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [decision, setDecision] = useState<ReviewDecision | ''>('');
  const [feedback, setFeedback] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const details = useQuery({ queryKey: ['provider-review', user?.id, providerId], enabled: !!user, queryFn: async () => {
    const [application, documents, history] = await Promise.all([service.application(providerId), service.evidence(providerId), service.history(providerId)]);
    return { application, documents, history };
  } });
  const application = details.data?.application;
  const snapshot = application?.organization_snapshot;
  const snapshotFields = snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot) ? Object.entries(snapshot).filter(([key, value]) => ['name','slug','provider_type','description','email','phone','website','state','city','address','country'].includes(key) && typeof value === 'string') : [];
  const submittedDocuments = details.data?.documents.filter(document => application?.document_ids.includes(document.id)) ?? [];
  return <section className="care-path mt-8" aria-labelledby="application-review-title">
    <h2 id="application-review-title" className="text-2xl mb-4">Application review</h2>
    {details.isPending ? <p role="status">Loading application…</p> : details.isError || !application ? <><p role="alert">Application unavailable.</p><Button variant="outline" onClick={() => void details.refetch()}>Refresh application</Button></> : <div className="space-y-6">
      <p>Status: {application.status.replaceAll('_', ' ')} · revision {application.revision}</p>
      <dl className="grid gap-3 sm:grid-cols-2">{snapshotFields.map(([key, value]) => <div key={key}><dt className="text-sm text-muted-foreground capitalize">{key.replaceAll('_', ' ')}</dt><dd className="whitespace-pre-wrap break-words">{String(value)}</dd></div>)}</dl>
      <div><h3 className="font-medium mb-3">Evidence in this submission</h3><ProviderEvidenceList documents={submittedDocuments} accountId={user?.id ?? ''} /></div>
      {application.feedback && <p className="whitespace-pre-wrap rounded-md bg-muted p-4">Latest feedback: {application.feedback}</p>}
      {['submitted','under_review','approved'].includes(application.status) && <form className="space-y-4" onSubmit={async event => {
        event.preventDefault(); if (!decision || busy || (decision === 'approved' && !confirmed)) return;
        setBusy(true); setError(''); setMessage('');
        try {
          await service.review(application, decision, feedback);
          setDecision(''); setFeedback(''); setConfirmed(false); setMessage('Review decision recorded.');
          await Promise.all([cache.invalidateQueries({ queryKey: ['provider-review', user?.id, providerId] }), cache.invalidateQueries({ queryKey: ['provider-review-queue', user?.id] })]);
        } catch (cause) { setError(verificationError(cause)); }
        finally { setBusy(false); }
      }}>
        <fieldset disabled={busy} className="space-y-4"><legend className="font-medium mb-3">Record a decision</legend>
          <p className="text-sm text-muted-foreground">Approval requires checking the evidence and applicable licences. It keeps the organization inactive; it does not publish services or approve an individual's licence. You cannot review your own organization.</p>
          <div><Label htmlFor="review-decision">Decision</Label><select id="review-decision" required value={decision} onChange={e => { setDecision(e.target.value as ReviewDecision | ''); setConfirmed(false); }} className="w-full border rounded-md bg-background p-3">
            <option value="">Choose a decision</option>
            {application.status === 'submitted' && <option value="under_review">Start review</option>}
            {['submitted','under_review'].includes(application.status) && <><option value="more_info_required">Request more information</option><option value="rejected">Reject application</option><option value="approved">Approve organization</option></>}
            {application.status === 'approved' && <option value="suspended">Suspend organization</option>}
          </select></div>
          <div><Label htmlFor="review-feedback">Feedback visible to the organization owner</Label><Textarea id="review-feedback" maxLength={3000} value={feedback} onChange={e => setFeedback(e.target.value)} required={['more_info_required','rejected','suspended'].includes(decision)} minLength={['more_info_required','rejected','suspended'].includes(decision) ? 10 : undefined} /></div>
          {decision === 'approved' && <label className="flex gap-3 items-start"><input className="mt-1" type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />I reviewed the submitted evidence and applicable licence validity.</label>}
        </fieldset>
        <Button type="submit" disabled={busy || !decision || (decision === 'approved' && !confirmed)}>{busy ? 'Recording…' : 'Record decision'}</Button>
      </form>}
      <Button variant="outline" disabled={busy} onClick={() => void details.refetch()}>Refresh application</Button>
      <ProviderVerificationHistory events={details.data?.history ?? []} documents={details.data?.documents ?? []} accountId={user?.id ?? ''} />
    </div>}
    {error && <p role="alert" className="mt-4 text-destructive">{error}</p>}
    {message && <p role="status" className="mt-4">{message}</p>}
  </section>;
}
export default function ProviderVerificationQueue() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<keyof typeof filters>('pending');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState('');
  const queue = useQuery({ queryKey: ['provider-review-queue', user?.id, filter, page], enabled: !!user, queryFn: () => service.queue(filters[filter], page) });
  return <div className="min-h-screen bg-background"><Navbar /><main className="container-wide max-w-5xl pt-32 pb-20">
    <h1 className="text-3xl mb-4">Organization verification</h1>
    <p className="text-muted-foreground mb-6">Review the submitted business snapshot and private documents. Each decision is recorded in the audit trail and review history.</p>
    <Label htmlFor="queue-filter">Applications</Label><select id="queue-filter" value={filter} onChange={e => { setFilter(e.target.value as keyof typeof filters); setPage(0); setSelected(''); }} className="border rounded-md bg-background p-3 block mb-6"><option value="pending">Pending review</option><option value="returned">Returned or rejected</option><option value="approved">Approved</option><option value="suspended">Suspended</option></select>
    {queue.isPending ? <p role="status">Loading applications…</p> : queue.isError ? <><p role="alert">Could not load applications.</p><Button onClick={() => void queue.refetch()}>Retry applications</Button></> : queue.data?.cases.length ? <ul className="space-y-3">{queue.data.cases.map(application => <li key={application.id} className="border rounded-lg p-4 flex flex-wrap justify-between items-center gap-3"><div><p className="font-medium">{application.organization?.name ?? 'Organization unavailable'}</p><p className="text-sm text-muted-foreground">{application.status.replaceAll('_',' ')} · revision {application.revision}</p></div><Button variant="outline" onClick={() => setSelected(application.provider_id)}>Review application</Button></li>)}</ul> : <p>No applications in this view.</p>}
    <div className="flex items-center gap-4 mt-6"><Button variant="outline" disabled={page===0 || queue.isFetching} onClick={() => { setPage(previous => previous-1); setSelected(''); }}>Previous</Button><span>Page {page+1}</span><Button variant="outline" disabled={!queue.data?.hasNext || queue.isFetching} onClick={() => { setPage(previous => previous+1); setSelected(''); }}>Next</Button></div>
    {selected && <ApplicationReview key={`${user?.id}-${selected}`} providerId={selected} />}
  </main></div>;
}
