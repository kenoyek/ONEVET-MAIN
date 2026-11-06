import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Database } from '@/integrations/supabase/types';
import type { ProviderEvidence } from '@/lib/services/provider-verification-service';
vi.mock('@/components/provider/ProviderEvidenceList', () => ({ ProviderEvidenceList: ({ documents }: { documents: ProviderEvidence[] }) => <div>{documents.map(document => <span key={document.id}>{document.file_path}</span>)}</div> }));
import { ProviderVerificationHistory } from '@/components/provider/ProviderVerificationHistory';
describe('Verification history snapshots', () => {
  it('shows the original business details and submitted files after a later correction', () => {
    const event: Database['public']['Tables']['provider_verification_events']['Row'] = { id: 'event-id', provider_id: 'org-id', case_id: 'case-id', actor_id: 'owner-id', status: 'submitted', feedback: '', revision: 1, created_at: '2026-11-06T12:00:00Z', document_ids: ['old-doc'], organization_snapshot: { name: 'Original business name', city: 'Abuja' } };
    const documents = [{ id: 'old-doc', file_path: 'original-evidence.pdf', is_current: false }, { id: 'new-doc', file_path: 'replacement-evidence.pdf', is_current: true }] as ProviderEvidence[];
    render(<ProviderVerificationHistory events={[event]} documents={documents} accountId="owner-id" />);
    fireEvent.click(screen.getByText('Review history (latest 50 events)'));
    fireEvent.click(screen.getByText('Business details and evidence at this revision'));
    expect(screen.getByText('Original business name')).toBeInTheDocument();
    expect(screen.getByText('original-evidence.pdf')).toBeInTheDocument();
    expect(screen.queryByText('replacement-evidence.pdf')).not.toBeInTheDocument();
  });
});
