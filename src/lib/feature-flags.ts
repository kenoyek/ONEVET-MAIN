import { useState, useEffect } from 'react';

/**
 * Feature flag keys for phased rollout of 1vet platform capabilities.
 */
export type FeatureFlagKey =
  | 'provider_marketplace_enabled'
  | 'grooming_enabled'
  | 'laboratory_enabled'
  | 'pharmacy_enabled'
  | 'subscriptions_enabled'
  | 'ai_triage_enabled'
  | 'customer_farms_enabled'
  | 'livestock_enabled'
  | 'insurance_enabled';

/**
 * Default feature flag statuses for initial phase rollout.
 * Features are enabled by default for existing modules (e.g. subscriptions, marketplace base)
 * and disabled or gated for pending phased modules.
 */
const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, boolean> = {
  provider_marketplace_enabled: true,
  grooming_enabled: true,
  laboratory_enabled: false,
  pharmacy_enabled: false,
  subscriptions_enabled: true,
  ai_triage_enabled: false,
  livestock_enabled: true,
  customer_farms_enabled: false, // Enable only after the customer-farm RLS migration is deployed.
  insurance_enabled: false,
};

/**
 * Get env variable override for feature flag (e.g. VITE_FEATURE_GROOMING_ENABLED=true)
 */
function getEnvOverride(flag: FeatureFlagKey): boolean | undefined {
  const envKey = `VITE_FEATURE_${flag.toUpperCase()}`;
  const val = import.meta.env[envKey];
  if (val === 'true' || val === '1') return true;
  if (val === 'false' || val === '0') return false;
  return undefined;
}

/**
 * Get local storage override for dev testing
 */
function getLocalStorageOverride(flag: FeatureFlagKey): boolean | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const stored = localStorage.getItem(`1vet_ff_${flag}`);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    // Ignore storage errors
  }
  return undefined;
}

/**
 * Evaluates whether a given feature flag is enabled.
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  // This rollout requires a reviewed backend migration. Production builds cannot
  // enable it through a leftover development localStorage override.
  if (flag === 'customer_farms_enabled' && !import.meta.env.DEV) {
    return getEnvOverride(flag) ?? DEFAULT_FEATURE_FLAGS[flag];
  }
  const localOverride = getLocalStorageOverride(flag);
  if (localOverride !== undefined) return localOverride;

  const envOverride = getEnvOverride(flag);
  if (envOverride !== undefined) return envOverride;

  return DEFAULT_FEATURE_FLAGS[flag] ?? false;
}

/**
 * Sets a local storage override for testing/debugging.
 */
export function setFeatureFlagOverride(flag: FeatureFlagKey, value: boolean | null): void {
  if (typeof window === 'undefined') return;
  const key = `1vet_ff_${flag}`;
  if (value === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, String(value));
  }
  window.dispatchEvent(new Event('1vet_feature_flags_updated'));
}

/**
 * Returns object containing status of all feature flags.
 */
export function getAllFeatureFlags(): Record<FeatureFlagKey, boolean> {
  const keys = Object.keys(DEFAULT_FEATURE_FLAGS) as FeatureFlagKey[];
  const flags = {} as Record<FeatureFlagKey, boolean>;
  keys.forEach((key) => {
    flags[key] = isFeatureEnabled(key);
  });
  return flags;
}

/**
 * React Hook for consuming feature flags in components.
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<FeatureFlagKey, boolean>>(getAllFeatureFlags);

  useEffect(() => {
    const handleUpdate = () => {
      setFlags(getAllFeatureFlags());
    };

    window.addEventListener('1vet_feature_flags_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('1vet_feature_flags_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    flags,
    isEnabled: (flag: FeatureFlagKey) => flags[flag] ?? false,
    setOverride: setFeatureFlagOverride,
  };
}
