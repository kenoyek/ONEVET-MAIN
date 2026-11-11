import { describe, expect, it } from 'vitest';
import { registrationIntent } from '@/lib/registration-intent';
describe('onboarding link intent', () => {
  it.each(['provider','service_provider','business'])('opens provider signup for %s', role => expect(registrationIntent(role).audience).toBe('provider'));
  it.each(['veterinarian','vet'])('preselects a veterinary application for %s', role => expect(registrationIntent(role).providerCategory).toBe('Veterinarian'));
  it('keeps clients and farmers in customer signup without granting a professional role', () => {
    expect(registrationIntent('client').audience).toBe('client');
    expect(registrationIntent('farmer').customerType).toBe('farm_owner');
    expect(registrationIntent('admin').audience).toBeNull();
  });
});
