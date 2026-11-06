import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { evidenceKinds, providerVerificationService, verificationError, type ProviderEvidence } from '@/lib/services/provider-verification-service';
function EvidenceLink({ document }: { document: ProviderEvidence }) {
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <li className="rounded-lg border p-4 space-y-2">
    <p className="font-medium">{evidenceKinds[document.document_type as keyof typeof evidenceKinds] ?? 'Document'}{!document.is_current && ' · superseded'}</p>
    <p className="text-sm text-muted-foreground">Uploaded {new Date(document.created_at).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' })} · {document.expires_at ? `Expires ${document.expires_at}` : 'No expiry date recorded'}</p>
    <Button type="button" variant="outline" size="sm" disabled={busy} onClick={async () => {
      setBusy(true); setError(''); setLink('');
      try { setLink(await providerVerificationService.signedUrl(document.file_path)); }
      catch (cause) { setError(verificationError(cause)); }
      finally { setBusy(false); }
    }}>{busy ? 'Preparing…' : 'Get private document link'}</Button>
    {link && <p><a href={link} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open document</a><span className="text-sm text-muted-foreground"> · Link expires after 60 seconds; generate another if needed.</span></p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </li>;
}
export function ProviderEvidenceList({ documents, accountId }: { documents: ProviderEvidence[]; accountId: string }) {
  return documents.length ? <ul className="space-y-3">{documents.map(document => <EvidenceLink key={`${accountId}-${document.id}`} document={document} />)}</ul> : <p className="text-muted-foreground">No documents attached yet.</p>;
}
