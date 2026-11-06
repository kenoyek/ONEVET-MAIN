import { describe, expect, it, vi, beforeEach } from 'vitest';
const { rpc, from, select, eq, order } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc, from } }));
import { providerDraftService, emptyProviderDraft, providerDraftSchema, providerDraftError } from '@/lib/services/provider-draft-service';
const valid = { ...emptyProviderDraft(' clinic@example.invalid '), name: ' Clinic ', slug: 'test-clinic', state: 'FCT', city: 'Abuja', address: '12 Example Road' };
describe('Main provider draft service', () => {
  beforeEach(() => { rpc.mockReset(); });
  it('uses one atomic RPC and sends no caller-supplied actor or approval', async () => {
    rpc.mockResolvedValue({ data: 'organization-id', error: null });
    expect(await providerDraftService.save(valid)).toEqual({ id: 'organization-id', slug: 'test-clinic' });
    expect(rpc).toHaveBeenCalledExactlyOnceWith('save_provider_draft', { input: { ...valid, name: 'Clinic', email: 'clinic@example.invalid' } });
  });
  it('limits the owner list explicitly even when administrator RLS permits broader reads', async () => {
    from.mockReturnValue({ select }); select.mockReturnValue({ eq }); eq.mockReturnValue({ order });
    order.mockResolvedValue({ data: [], error: null });
    expect(await providerDraftService.list('owner-id')).toEqual([]);
    expect(eq).toHaveBeenCalledWith('created_by', 'owner-id');
  });
  it('passes a known organization ID only on edits', async () => {
    rpc.mockResolvedValue({ data: 'organization-id', error: null });
    await providerDraftService.save(valid, 'organization-id');
    expect(rpc.mock.calls[0]?.[1].provider_uuid).toBe('organization-id');
  });
  it('rejects incomplete addresses and unsafe website schemes before networking', async () => {
    await expect(providerDraftService.save({ ...valid, address: '' })).rejects.toThrow();
    await expect(providerDraftService.save({ ...valid, website: 'javascript:alert(1)' })).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });
  it('rejects spoofed fields and preserves database failures for retry feedback', async () => {
    expect(providerDraftSchema.safeParse({ ...valid, verification_status: 'approved' }).success).toBe(false);
    rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
    await expect(providerDraftService.save(valid)).rejects.toEqual({ code: '42501' });
    expect(providerDraftError({ code: '42501' })).toContain('unavailable');
  });
});
