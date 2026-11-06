import { describe, it, expect } from 'vitest';
import { isFeatureEnabled, getAllFeatureFlags, setFeatureFlagOverride } from '@/lib/feature-flags';
import { env } from '@/lib/env';

describe('Phase 0 Technical Foundation', () => {
  it('validates environment module exports correctly', () => {
    expect(env).toBeDefined();
    expect(typeof env.supabaseUrl).toBe('string');
    expect(typeof env.supabaseAnonKey).toBe('string');
  });

  it('evaluates feature flag framework defaults and overrides', () => {
    expect(isFeatureEnabled('provider_marketplace_enabled')).toBe(false);
    expect(isFeatureEnabled('pharmacy_enabled')).toBe(false);

    const allFlags = getAllFeatureFlags();
    expect(allFlags).toHaveProperty('provider_marketplace_enabled');
    expect(allFlags).toHaveProperty('ai_triage_enabled');
    expect(allFlags).toHaveProperty('insurance_enabled');

    // Test override
    setFeatureFlagOverride('pharmacy_enabled', true);
    expect(isFeatureEnabled('pharmacy_enabled')).toBe(true);

    // Clean up override
    setFeatureFlagOverride('pharmacy_enabled', null);
    expect(isFeatureEnabled('pharmacy_enabled')).toBe(false);
  });
});
