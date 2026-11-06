import { beforeEach, describe, expect, it, vi } from 'vitest';
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
import { providerCatalogService as service, publicationError } from '@/lib/services/provider-catalog-service';
const valid = { name: 'Care session', description: 'A clear description of the offered service.', category: 'grooming' as const, delivery_mode: 'clinic_visit' as const, duration_minutes: 45, base_price: 5000.5 };
describe('Provider service publication client', () => {
  beforeEach(() => { rpc.mockReset(); });
  it('saves a private service through the trusted RPC without a client owner or publication flag', async () => {
    rpc.mockResolvedValue({ data: 'service-id', error: null });
    await service.save('org-id', valid);
    expect(rpc).toHaveBeenCalledExactlyOnceWith('save_provider_service', { provider_uuid: 'org-id', input: valid });
  });
  it('passes the reviewed revision for edits and publication', async () => {
    rpc.mockResolvedValue({ data: 'service-id', error: null });
    await service.save('org-id', valid, { id: 'service-id', version: 3 });
    expect(rpc.mock.calls[0]?.[1]).toMatchObject({ service_uuid: 'service-id', expected_version: 3 });
    await service.publish({ id: 'service-id', version: 4 }, true);
    expect(rpc).toHaveBeenLastCalledWith('set_provider_service_publication', { service_uuid: 'service-id', expected_version: 4, publish: true });
  });
  it('rejects unsupported delivery and invalid price precision before networking', async () => {
    await expect(service.save('org-id', { ...valid, base_price: 10.123 })).rejects.toThrow();
    await expect(service.save('org-id', { ...valid, duration_minutes: 4 })).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });
  it('preserves stale-change failures for refresh feedback', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '40001' } });
    await expect(service.publish({ id: 'service-id', version: 3 }, false)).rejects.toEqual({ code: '40001' });
    expect(publicationError({ code: '40001' })).toContain('Refresh');
  });
});
