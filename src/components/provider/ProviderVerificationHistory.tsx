import type { Database } from '@/integrations/supabase/types';
import type { ProviderEvidence } from '@/lib/services/provider-verification-service';
import { ProviderEvidenceList } from './ProviderEvidenceList';
type Event = Database['public']['Tables']['provider_verification_events']['Row'];
export function ProviderVerificationHistory({ events, documents, accountId }: { events: Event[]; documents: ProviderEvidence[]; accountId: string }) {
  if (!events.length) return null;
  return <details><summary className="cursor-pointer font-medium">Review history (latest 50 events)</summary>
    <ol className="mt-3 space-y-4">{events.map(event => {
      const snapshot = event.organization_snapshot;
      const fields = snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot) ? Object.entries(snapshot).filter(([key, value]) => ['name','slug','provider_type','description','email','phone','website','state','city','address','country'].includes(key) && typeof value === 'string') : [];
      return <li key={event.id} className="border-l-2 pl-3 space-y-2">
        <p className="font-medium">{event.status.replaceAll('_', ' ')} · revision {event.revision}</p>
        {event.feedback && <p className="whitespace-pre-wrap text-sm">{event.feedback}</p>}
        <time className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT</time>
        {event.document_ids && <details><summary className="cursor-pointer text-sm">Business details and evidence at this revision</summary>
          <dl className="my-4 grid gap-3 sm:grid-cols-2">{fields.map(([key, value]) => <div key={key}><dt className="text-sm text-muted-foreground capitalize">{key.replaceAll('_', ' ')}</dt><dd className="break-words whitespace-pre-wrap text-sm">{String(value)}</dd></div>)}</dl>
          <ProviderEvidenceList accountId={accountId} documents={documents.filter(document => event.document_ids?.includes(document.id))} />
        </details>}
      </li>;
    })}</ol>
  </details>;
}
