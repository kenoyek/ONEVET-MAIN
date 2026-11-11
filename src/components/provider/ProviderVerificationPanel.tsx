import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProviderVerificationHistory } from './ProviderVerificationHistory';
import { ProviderEvidenceList } from './ProviderEvidenceList';
import { useAuth } from '@/lib/auth-context';
import { evidenceKinds, providerVerificationService as service, verificationError, type EvidenceKind } from '@/lib/services/provider-verification-service';
export function ProviderVerificationPanel({ providerId, status, suspended }: { providerId: string; status: string; suspended: boolean }) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [kind, setKind] = useState<EvidenceKind>('business_registration');
  const [file, setFile] = useState<File | null>(null);
  const [expiry, setExpiry] = useState('');
  const [pendingPath, setPendingPath] = useState('');
  const [busy, setBusy] = useState(false);
  const actionLock = useRef(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [fileKey, setFileKey] = useState(0);
  const editable = !suspended && ['draft', 'more_info_required', 'rejected'].includes(status);
  const details = useQuery({ queryKey: ['provider-verification', user?.id, providerId], enabled: !!user, queryFn: async () => {
    const [documents, application, history] = await Promise.all([service.evidence(providerId), service.application(providerId), service.history(providerId)]);
    return { documents, application, history };
  } });
  async function refresh() {
    await Promise.all([cache.invalidateQueries({ queryKey: ['provider-verification', user?.id, providerId] }), cache.invalidateQueries({ queryKey: ['provider-draft', user?.id] }), cache.invalidateQueries({ queryKey: ['provider-drafts', user?.id] }), cache.invalidateQueries({ queryKey: ['provider-launch-public', user?.id] })]);
  }
  return <section id="organization-verification" className="care-path mb-8 scroll-mt-28" aria-labelledby="verification-title">
    <h2 id="verification-title" className="text-xl mb-3">Organization verification</h2>
    <p className="text-muted-foreground mb-5">Attach registration evidence and relevant professional licences. An administrator reviews the documents. Organization approval does not verify an individual's licence or publish services.</p>
    {details.isPending ? <p role="status">Loading verification…</p> : details.isError ? <><p role="alert">Could not load verification details.</p><Button variant="outline" onClick={() => void details.refetch()}>Retry verification details</Button></> : details.data && <div className="space-y-6">
      {details.data.application?.feedback && <div className="rounded-lg bg-muted p-4"><h3 className="font-medium">Reviewer feedback</h3><p className="whitespace-pre-wrap">{details.data.application.feedback}</p></div>}
      <ProviderEvidenceList documents={details.data.documents} accountId={user?.id ?? ''} />
      {editable && <form className="space-y-4" onSubmit={async event => {
        event.preventDefault(); if (actionLock.current || !file) return; actionLock.current = true;
        setBusy(true); setError(''); setMessage('');
        try {
          const path = pendingPath || await service.upload(providerId, file);
          setPendingPath(path);
          await service.register(providerId, kind, path, expiry);
          setPendingPath(''); setFile(null); setExpiry(''); setFileKey(previous => previous + 1);
          setMessage('Document attached privately.'); await refresh();
        } catch (cause) { setError(verificationError(cause)); }
        finally { actionLock.current = false; setBusy(false); }
      }}>
        <fieldset disabled={busy || !!pendingPath} className="space-y-4">
          <legend className="font-medium mb-3">Attach a document</legend>
          <div><Label htmlFor="evidence-kind">Document type</Label><select id="evidence-kind" className="w-full border rounded-md bg-background p-3" value={kind} onChange={e => setKind(e.target.value as EvidenceKind)}>{Object.entries(evidenceKinds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><Label htmlFor="evidence-file">PDF, JPEG or PNG · up to 10 MB</Label><Input key={fileKey} id="evidence-file" type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] ?? null)} /></div>
          <div><Label htmlFor="evidence-expiry">Expiry date (if applicable)</Label><Input id="evidence-expiry" type="date" value={expiry} onChange={e => setExpiry(e.target.value)} /></div>
        </fieldset>
        <p className="text-sm text-muted-foreground">Documents are private and retained with the review history. A new document of the same type replaces the current one for the next submission; earlier evidence remains in the history.</p>
        {pendingPath && <p role="status">File uploaded privately. Retry to finish attaching it before submitting.</p>}
        <Button type="submit" disabled={busy || !file}>{busy ? 'Attaching…' : pendingPath ? 'Retry attaching document' : 'Attach document'}</Button>
        {pendingPath && <Button type="button" variant="outline" disabled={busy} onClick={() => { setPendingPath(''); setFile(null); setFileKey(previous => previous + 1); }}>Choose another file</Button>}
      </form>}
      {editable && <div className="border-t pt-5"><p className="text-sm text-muted-foreground mb-3">Save any business changes below before submitting. Submitting sends the saved business details and locks details and evidence until the reviewer returns the application. At least one current document is required. Veterinary organizations must also complete individual veterinary verification before approval.</p>
        <Button disabled={busy || !!pendingPath || !details.data.documents.some(document => document.is_current)} onClick={async () => {
          if (actionLock.current) return; actionLock.current = true; setBusy(true); setError(''); setMessage('');
          try { await service.submit(providerId); setMessage('Application submitted for review.'); await refresh(); }
          catch (cause) { setError(verificationError(cause)); await refresh(); }
          finally { actionLock.current = false; setBusy(false); }
        }}>{busy ? 'Working…' : 'Submit for verification'}</Button>
      </div>}
      <ProviderVerificationHistory events={details.data.history} documents={details.data.documents} accountId={user?.id ?? ''} />
    </div>}
    {error && <p role="alert" className="mt-4 text-destructive">{error}</p>}
    {message && <p role="status" className="mt-4">{message}</p>}
  </section>;
}
