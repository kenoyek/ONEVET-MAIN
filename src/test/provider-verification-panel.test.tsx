import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { evidence, application, history, upload, register, submit } = vi.hoisted(() => ({ evidence: vi.fn(), application: vi.fn(), history: vi.fn(), upload: vi.fn(), register: vi.fn(), submit: vi.fn() }));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { id: 'owner-id' } }) }));
vi.mock('@/lib/services/provider-verification-service', async original => ({ ...await original<typeof import('@/lib/services/provider-verification-service')>(), providerVerificationService: { evidence, application, history, upload, register, submit } }));
import { ProviderVerificationPanel } from '@/components/provider/ProviderVerificationPanel';
function mount(status = 'draft') {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={cache}><ProviderVerificationPanel providerId="org-id" status={status} suspended={false} /></QueryClientProvider>);
}
describe('Owner verification workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks(); evidence.mockResolvedValue([]); application.mockResolvedValue(null); history.mockResolvedValue([]);
  });
  it('retries metadata attachment without uploading the private file twice', async () => {
    upload.mockResolvedValue('org-id/document.pdf');
    register.mockRejectedValueOnce(new Error('Network failure')).mockResolvedValueOnce('doc-id');
    mount();
    const fileInput = await screen.findByLabelText('PDF, JPEG or PNG · up to 10 MB');
    fireEvent.change(fileInput, { target: { files: [new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' })] } });
    fireEvent.click(screen.getByRole('button', { name: 'Attach document' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('try again');
    expect(screen.getByRole('button', { name: 'Submit for verification' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Retry attaching document' }));
    await screen.findByText('Document attached privately.');
    expect(upload).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledTimes(2);
  });
  it('sends one upload when the attachment form is submitted twice while pending', async () => {
    let finish!: (path: string) => void;
    upload.mockReturnValue(new Promise(resolve => { finish = resolve; })); register.mockResolvedValue('doc-id');
    mount(); const fileInput = await screen.findByLabelText('PDF, JPEG or PNG · up to 10 MB');
    fireEvent.change(fileInput, { target: { files: [new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' })] } });
    const form = fileInput.closest('form')!;
    fireEvent.submit(form); fireEvent.submit(form);
    expect(upload).toHaveBeenCalledTimes(1);
    finish('org-id/one-document.pdf'); await screen.findByText('Document attached privately.');
    expect(register).toHaveBeenCalledTimes(1);
  });
  it('shows reviewer feedback and prevents changes while submitted', async () => {
    application.mockResolvedValue({ feedback: 'Your application is being reviewed.' });
    mount('submitted');
    await screen.findByText('Your application is being reviewed.');
    expect(screen.queryByRole('button', { name: 'Attach document' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit for verification' })).not.toBeInTheDocument();
  });
  it('does not permit submission when verification details fail to load', async () => {
    evidence.mockRejectedValue(new Error('Unavailable'));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load');
    expect(screen.queryByRole('button', { name: 'Submit for verification' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry verification details' }));
    await waitFor(() => expect(evidence).toHaveBeenCalledTimes(2));
  });
});
