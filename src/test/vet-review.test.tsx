import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VetReviewDialog } from '@/components/onboarding/VetReviewDialog';
import type { PendingVet } from '@/lib/services/admin-vet-summary-service';
vi.mock('@/components/onboarding/LicenseDocumentLink', () => ({ LicenseDocumentLink: () => <button>View licence document</button> }));
const application: PendingVet = { id: 'profile', user_id: 'f0000000-0000-4000-8000-000000000001', first_name: 'Ada', last_name: 'Vet', email: 'ada@example.invalid', license_number: 'VCN-123', license_url: 'f0000000-0000-4000-8000-000000000001/licence.pdf', created_at: '2026-11-18', vendor_type: 'veterinarian' };
afterEach(cleanup);
describe('vet review confirmation', () => {
  it('requires explicit review and allows cancellation without a decision', () => {
    const confirm = vi.fn(), close = vi.fn();
    render(<VetReviewDialog application={application} approve onConfirm={confirm} onClose={close} />);
    expect(screen.getByText('Ada Vet')).toBeVisible(); expect(screen.getByText('VCN-123')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Confirm approval' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel review' }));
    expect(close).toHaveBeenCalledOnce(); expect(confirm).not.toHaveBeenCalled();
  });
  it('requires acknowledgement for rejection and keeps failures visible for retry', async () => {
    const confirm = vi.fn().mockRejectedValueOnce(new Error('Application changed. Refresh and review again.')).mockResolvedValueOnce(undefined), close = vi.fn();
    render(<VetReviewDialog application={application} approve={false} onConfirm={confirm} onClose={close} />);
    expect(screen.getByRole('button', { name: 'Confirm rejection' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm rejection' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Application changed'); expect(close).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm rejection' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Confirm rejection' }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce()); expect(confirm).toHaveBeenCalledTimes(2);
  });
  it('blocks repeat decisions and dismissal while a decision is saving', async () => {
    let resolve!: () => void;
    const confirm = vi.fn(() => new Promise<void>(done => { resolve = done; })), close = vi.fn();
    render(<VetReviewDialog application={application} approve onConfirm={confirm} onClose={close} />);
    fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }));
    expect(screen.getByRole('button', { name: 'Saving decision…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel review' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' }); expect(close).not.toHaveBeenCalled();
    expect(confirm).toHaveBeenCalledOnce(); resolve(); await waitFor(() => expect(close).toHaveBeenCalledOnce());
  });
});
