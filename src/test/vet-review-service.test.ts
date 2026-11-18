import { beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ status: 'pending', number: 'VCN-123', document: 'f0000000-0000-4000-8000-000000000001/licence.pdf', error: null as unknown, writes: 0, approval: false }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const filters: Record<string, unknown> = {}; let patch: Record<string, unknown> = {};
  const query = { update: (value: Record<string, unknown>) => { patch = value; return query; }, eq: (key: string, value: unknown) => { filters[key] = value; return query; }, select: async () => {
    if (fixture.error) return { data: null, error: fixture.error };
    const matches = filters.verification_status === fixture.status && filters.license_number === fixture.number && filters.license_url === fixture.document;
    if (matches) { fixture.writes++; fixture.status = String(patch.verification_status); fixture.approval = Boolean(patch.license_verified); }
    return { data: matches ? [{ id: 'profile' }] : [], error: null };
  } }; return query;
} } }));
import { reviewVeterinarian } from '@/lib/services/vet-review-service';
const application = { id: 'profile', user_id: 'f0000000-0000-4000-8000-000000000001', first_name: 'Ada', last_name: 'Vet', email: null, license_number: 'VCN-123', license_url: fixture.document, created_at: '2026-11-18', vendor_type: null };
beforeEach(() => { fixture.status = 'pending'; fixture.number = 'VCN-123'; fixture.document = application.license_url; fixture.writes = 0; fixture.error = null; fixture.approval = false; });
it.each([true, false])('does not decide a replaced licence snapshot (approve=%s)', async approve => {
  fixture.document = application.user_id + '/replacement.pdf';
  await expect(reviewVeterinarian(application, approve)).rejects.toThrow('has changed'); expect(fixture.writes).toBe(0);
});
it.each([true, false])('does not overwrite another reviewer decision (approve=%s)', async approve => {
  fixture.status = 'approved'; await expect(reviewVeterinarian(application, approve)).rejects.toThrow('has changed'); expect(fixture.writes).toBe(0);
});
it('requires a complete applicant-owned submission before any decision', async () => {
  await expect(reviewVeterinarian({ ...application, license_number: ' ' }, false)).rejects.toThrow('complete licence');
  await expect(reviewVeterinarian({ ...application, license_url: 'f0000000-0000-4000-8000-000000000002/licence.pdf' }, true)).rejects.toThrow('complete licence'); expect(fixture.writes).toBe(0);
});
it.each([true, false])('saves the requested pending decision once (approve=%s)', async approve => {
  await reviewVeterinarian(application, approve); expect(fixture.status).toBe(approve ? 'approved' : 'rejected'); expect(fixture.approval).toBe(approve); expect(fixture.writes).toBe(1);
  await expect(reviewVeterinarian(application, approve)).rejects.toThrow('has changed'); expect(fixture.writes).toBe(1);
});
it('propagates database failures without reporting a saved decision', async () => {
  fixture.error = new Error('Permission denied'); await expect(reviewVeterinarian(application, true)).rejects.toThrow('Permission denied'); expect(fixture.writes).toBe(0);
});
