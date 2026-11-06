import { afterEach, describe, expect, it, vi } from 'vitest';
import { isFeatureEnabled } from '@/lib/feature-flags';
afterEach(() => {
  localStorage.clear();
  vi.unstubAllEnvs();
});
describe('Farm production rollout gate', () => {
  it('ignores a development storage override in production', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_FEATURE_CUSTOMER_FARMS_ENABLED', 'false');
    localStorage.setItem('1vet_ff_customer_farms_enabled', 'true');
    expect(isFeatureEnabled('customer_farms_enabled')).toBe(false);
  });
  it('requires the explicit production environment flag', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_FEATURE_CUSTOMER_FARMS_ENABLED', 'true');
    expect(isFeatureEnabled('customer_farms_enabled')).toBe(true);
  });
});
