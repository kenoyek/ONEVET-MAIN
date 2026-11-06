import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProviderDraftForm } from '@/components/provider/ProviderDraftForm';
import { emptyProviderDraft } from '@/lib/services/provider-draft-service';

const valid = { ...emptyProviderDraft('clinic@example.invalid'), name: 'Test Clinic', slug: 'test-clinic', state: 'Oyo', city: 'Ibadan', address: '12 Example Road' };
describe('Provider draft form', () => {
  it('retains entered details after a failed save and permits retry', async () => {
    const save = vi.fn().mockRejectedValueOnce({ code: '23505' }).mockResolvedValueOnce(undefined);
    render(<ProviderDraftForm initial={valid} onSave={save} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save organization draft' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already in use');
    expect(screen.getByLabelText('Organization name')).toHaveValue('Test Clinic');
    fireEvent.change(screen.getByLabelText('Organization identifier'), { target: { value: 'another-clinic' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save organization draft' }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save.mock.calls[1]?.[0].slug).toBe('another-clinic');
  });
  it('prevents duplicate saves while a request is pending', async () => {
    let resolve!: () => void;
    const save = vi.fn(() => new Promise<void>(done => { resolve = done; }));
    render(<ProviderDraftForm initial={valid} onSave={save} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save organization draft' }));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByLabelText('Organization name')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Saving…' }));
    expect(save).toHaveBeenCalledTimes(1);
    resolve();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save organization draft' })).toBeEnabled());
  });
  it('keeps identifier and category fixed when editing', () => {
    render(<ProviderDraftForm initial={valid} editing onSave={vi.fn()} />);
    expect(screen.getByLabelText('Organization identifier')).toBeDisabled();
    expect(screen.getByLabelText('Business category')).toBeDisabled();
    expect(screen.getByLabelText('Street address')).toBeEnabled();
  });
});
