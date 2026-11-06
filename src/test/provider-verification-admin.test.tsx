import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { queue, application, evidence, history, review } = vi.hoisted(() => ({ queue: vi.fn(), application: vi.fn(), evidence: vi.fn(), history: vi.fn(), review: vi.fn() }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => <nav>Navigation</nav> }));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { id: 'admin-id' } }) }));
vi.mock('@/lib/services/provider-verification-service', async original => ({ ...await original<typeof import('@/lib/services/provider-verification-service')>(), providerVerificationService: { queue, application, evidence, history, review } }));
import ProviderVerificationQueue from '@/pages/admin/ProviderVerificationQueue';
const current = { id: 'case-id', provider_id: 'org-id', status: 'submitted', revision: 3, document_ids: [], organization_snapshot: { name: 'Test clinic', email: 'clinic@example.invalid' }, feedback: '' };
function mount() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={cache}><ProviderVerificationQueue /></QueryClientProvider>);
}
describe('Administrator verification review', () => {
  beforeEach(() => {
    vi.clearAllMocks(); queue.mockResolvedValue({ cases: [{ ...current, organization: { name: 'Test clinic' } }], hasNext: false });
    application.mockResolvedValue(current); evidence.mockResolvedValue([]); history.mockResolvedValue([]);
  });
  it('requires explicit evidence confirmation before approval', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Review application' }));
    fireEvent.change(await screen.findByLabelText('Decision'), { target: { value: 'approved' } });
    expect(screen.getByRole('button', { name: 'Record decision' })).toBeDisabled();
    expect(review).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: 'Record decision' })).toBeEnabled();
  });
  it('retains feedback after a stale review and uses the refreshed revision on retry', async () => {
    application.mockResolvedValueOnce(current).mockResolvedValue({ ...current, revision: 4 });
    review.mockRejectedValueOnce({ code: '40001' }).mockResolvedValueOnce('case-id');
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Review application' }));
    fireEvent.change(await screen.findByLabelText('Decision'), { target: { value: 'more_info_required' } });
    fireEvent.change(screen.getByLabelText('Feedback visible to the organization owner'), { target: { value: 'Please provide a current licence.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record decision' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Refresh');
    expect(screen.getByLabelText('Feedback visible to the organization owner')).toHaveValue('Please provide a current licence.');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh application' }));
    await screen.findByText('Status: submitted · revision 4');
    fireEvent.click(screen.getByRole('button', { name: 'Record decision' }));
    await waitFor(() => expect(review).toHaveBeenCalledTimes(2));
    expect(review.mock.calls[1]?.[0].revision).toBe(4);
    expect(review.mock.calls[1]?.[2]).toBe('Please provide a current licence.');
    await screen.findByText('Review decision recorded.');
  });
});
