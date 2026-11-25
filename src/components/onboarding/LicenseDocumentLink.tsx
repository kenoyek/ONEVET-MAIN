import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { veterinaryLicenseLink } from '@/lib/services/license-service';

export function LicenseDocumentLink({ value, ownerUserId, onOpen }: { value: string; ownerUserId: string; onOpen?: () => void }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function prepareLink() {
    setBusy(true);
    setError('');
    setUrl('');
    try {
      setUrl(await veterinaryLicenseLink(value, ownerUserId));
    } catch {
      setError('The document could not be opened. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <Button type="button" variant="link" className="h-auto p-0 text-sm" disabled={busy}
        onClick={() => void prepareLink()}>
        {busy ? 'Preparing link…' : url ? 'Refresh document link' : 'Prepare document link'}
      </Button>
      {url && (
        <a className="block text-sm text-primary underline" href={url} target="_blank" rel="noopener noreferrer" onClick={onOpen}>
          Open licence document <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
