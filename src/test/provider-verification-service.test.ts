import { beforeEach, describe, expect, it, vi } from 'vitest';
const { rpc, upload, createSignedUrl, storageFrom } = vi.hoisted(() => ({ rpc: vi.fn(), upload: vi.fn(), createSignedUrl: vi.fn(), storageFrom: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc, storage: { from: storageFrom } } }));
import { providerVerificationService as service, validateEvidenceFile, verificationError, type VerificationCase } from '@/lib/services/provider-verification-service';
describe('Provider verification service', () => {
  beforeEach(() => { vi.clearAllMocks(); storageFrom.mockReturnValue({ upload, createSignedUrl }); });
  it('rejects unsafe formats, empty files and oversized evidence before upload', () => {
    expect(() => validateEvidenceFile(new File(['script'], 'bad.html', { type: 'text/html' }))).toThrow('PDF');
    expect(() => validateEvidenceFile(new File([], 'empty.pdf', { type: 'application/pdf' }))).toThrow('non-empty');
    const large = new File(['x'], 'large.pdf', { type: 'application/pdf' });
    Object.defineProperty(large, 'size', { value: 11 * 1024 * 1024 });
    expect(() => validateEvidenceFile(large)).toThrow('10 MB');
    expect(upload).not.toHaveBeenCalled();
  });
  it('uploads immutable private files with random names and no user-supplied filename', async () => {
    upload.mockResolvedValue({ error: null });
    const file = new File(['%PDF'], 'sensitive-person-name.pdf', { type: 'application/pdf' });
    const path = await service.upload('organization-id', file);
    expect(storageFrom).toHaveBeenCalledWith('provider-credentials');
    expect(path).toMatch(/^organization-id\/[0-9a-f-]{36}\.pdf$/);
    expect(upload).toHaveBeenCalledWith(path, file, { upsert: false, contentType: 'application/pdf' });
  });
  it('creates short-lived signed links rather than public document URLs', async () => {
    createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://example.invalid/private' }, error: null });
    expect(await service.signedUrl('org/doc.pdf')).toBe('https://example.invalid/private');
    expect(createSignedUrl).toHaveBeenCalledWith('org/doc.pdf', 60);
  });
  it('submits without trusting a caller-supplied owner or approval status', async () => {
    rpc.mockResolvedValue({ data: 'case-id', error: null });
    await service.submit('organization-id');
    expect(rpc).toHaveBeenCalledExactlyOnceWith('submit_provider_verification', { provider_uuid: 'organization-id' });
  });
  it('includes the reviewed revision and preserves stale-review errors', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '40001' } });
    const application = { provider_id: 'organization-id', revision: 7 } as VerificationCase;
    await expect(service.review(application, 'approved', ' Checked ')).rejects.toEqual({ code: '40001' });
    expect(rpc).toHaveBeenCalledWith('review_provider_verification', { provider_uuid: 'organization-id', expected_revision: 7, decision: 'approved', owner_feedback: 'Checked' });
    expect(verificationError({ code: '40001' })).toContain('Refresh');
  });
  it('requires useful owner feedback for rejection and requests for information', async () => {
    const application = { provider_id: 'organization-id', revision: 7 } as VerificationCase;
    await expect(service.review(application, 'more_info_required', 'short')).rejects.toThrow('10–3000');
    expect(rpc).not.toHaveBeenCalled();
  });
});
