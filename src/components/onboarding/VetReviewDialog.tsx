import { useRef, useState } from 'react';
import type { PendingVet } from '@/lib/services/admin-vet-summary-service';
import { LicenseDocumentLink } from './LicenseDocumentLink';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function VetReviewDialog({ application, approve, onClose, onConfirm }: {
  application: PendingVet;
  approve: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [openedDocument, setOpenedDocument] = useState(false);
  const canAcknowledge = !approve || openedDocument;
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const name = [application.first_name, application.last_name].filter(Boolean).join(' ') || 'this applicant';
  async function confirm() {
    if (lock.current || !canAcknowledge || !reviewed) return;
    lock.current = true; setBusy(true); setError('');
    try { await onConfirm(); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The decision could not be saved. Try again.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <AlertDialog open onOpenChange={open => { if (!open && !lock.current) onClose(); }}>
    <AlertDialogContent className="max-h-[85dvh] overflow-y-auto">
      <AlertDialogHeader>
        <AlertDialogTitle>{approve ? 'Approve veterinarian?' : 'Reject application?'}</AlertDialogTitle>
        <AlertDialogDescription>
          {approve ? 'Confirm that the professional licence supports approval. An active, approved vet can accept consultations. Practice and organization approval are separate.' : 'This application will need correction before the applicant can accept consultations. Review the licence details before confirming.'}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="min-w-0 rounded-xl border bg-muted/20 p-4">
        <p className="break-words font-semibold">{name}</p>
        {application.email && <p className="break-all text-sm text-muted-foreground">{application.email}</p>}
        <p className="mt-3 break-all text-sm">Licence number: <strong>{application.license_number}</strong></p>
        {application.license_url && (
          <LicenseDocumentLink value={application.license_url} ownerUserId={application.user_id}
            onOpen={() => setOpenedDocument(true)} />
        )}
        {approve && !openedDocument && <p className="mt-2 text-sm text-muted-foreground">Open the licence document to continue with approval.</p>}
      </div>
      <div className="flex items-start gap-3">
        <Checkbox id="vet-review-confirmed" checked={reviewed} disabled={busy || !canAcknowledge} onCheckedChange={value => setReviewed(value === true)} />
        <Label htmlFor="vet-review-confirmed" className="leading-relaxed">I have reviewed this applicant’s licence number and document.</Label>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" disabled={busy} onClick={onClose}>Cancel review</Button>
        <Button variant={approve ? 'default' : 'destructive'} disabled={busy || !canAcknowledge || !reviewed} onClick={() => void confirm()}>
          {busy ? 'Saving decision…' : approve ? 'Confirm approval' : 'Confirm rejection'}
        </Button>
      </div>
    </AlertDialogContent>
  </AlertDialog>;
}
