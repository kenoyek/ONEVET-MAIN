import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { veterinaryLicenseLink } from '@/lib/services/license-service';
export function LicenseDocumentLink({ value, ownerUserId }: { value: string; ownerUserId: string }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <div className="mt-2 space-y-2">
    <Button type="button" variant="link" className="h-auto p-0 text-sm" disabled={busy} onClick={async () => {
      setBusy(true); setError(''); setUrl('');
      try { const signed = await veterinaryLicenseLink(value, ownerUserId); setUrl(signed); window.open(signed, '_blank', 'noopener,noreferrer'); }
      catch { setError('The document could not be opened. Try again.'); }
      finally { setBusy(false); }
    }}>{busy ? 'Opening document…' : 'View license document'}</Button>
    {url && <a className="block text-xs text-primary underline" href={url} target="_blank" rel="noopener noreferrer">If a new tab did not open, open the document here.</a>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
