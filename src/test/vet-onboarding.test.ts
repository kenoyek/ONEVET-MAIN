import { describe, expect, it } from 'vitest';
import { vetOnboardingStatus, type VetOnboardingProfile } from '@/lib/vet-onboarding';
const id = 'f0000000-0000-4000-8000-000000000001';
const draft: VetOnboardingProfile = { user_id: id, license_number: null, license_url: null, license_verified: false, verification_status: 'pending', is_active: true };
const submitted = { ...draft, license_number: 'VCN-123', license_url: id + '/licence.pdf' };
describe('applicant onboarding status', () => {
  it('requires both saved licence fields before saying awaiting review', () => {
    for (const profile of [null, draft, { ...draft, license_number: 'VCN-123' }, { ...submitted, license_number: '   ' }, { ...submitted, license_url: 'f0000000-0000-4000-8000-000000000002/licence.pdf' }]) {
      const status = vetOnboardingStatus(profile);
      expect(status.label).toBe('Complete your professional details');
      expect(status.approved).toBe(false);
      expect(status.checklist.some(item => !item.complete)).toBe(true);
    }
  });
  it('recognizes a ready pending submission without promising approval', () => {
    const status = vetOnboardingStatus(submitted);
    expect(status.label).toBe('Awaiting professional review');
    expect(status.approved).toBe(false);
    expect(status.checklist.every(item => item.complete)).toBe(true);
    expect(status.href).toBe('/profile#credentials');
  });
  it('shows returned applications as needing attention even with complete documents', () => {
    const status = vetOnboardingStatus({ ...submitted, verification_status: 'rejected' });
    expect(status.label).toBe('Application needs attention');
    expect(status.description).toContain('corrected document');
    expect(status.approved).toBe(false);
  });
  it('only recognizes approval for an active approved verified profile', () => {
    expect(vetOnboardingStatus({ ...submitted, verification_status: 'approved', license_verified: true }).approved).toBe(true);
    for (const flags of [{ verification_status: 'pending', license_verified: true }, { verification_status: 'approved', license_verified: false }, { verification_status: 'approved', license_verified: true, is_active: null }]) {
      expect(vetOnboardingStatus({ ...submitted, ...flags }).approved).toBe(false);
    }
  });
  it('prioritizes inactive accounts and routes them to support', () => {
    const status = vetOnboardingStatus({ ...submitted, verification_status: 'approved', license_verified: true, is_active: false });
    expect(status.label).toBe('Account inactive'); expect(status.href).toBe('/contact'); expect(status.approved).toBe(false);
  });
  it('does not call unconfirmed approval pending review', () => {
    const status = vetOnboardingStatus({ ...submitted, verification_status: 'inactive' });
    expect(status.label).toBe('Approval needs confirmation'); expect(status.href).toBe('/contact');
  });
});
