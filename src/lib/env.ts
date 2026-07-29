/**
 * Environment variable validation and access for 1vet Platform.
 * Ensures required secrets and endpoint configurations are present at startup.
 */

interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  paystackPublicKey: string;
  appUrl: string;
  isDev: boolean;
  isProd: boolean;
}

function validateEnv(): EnvConfig {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fxvctkfhitpgfyaztqor.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_faCoot0rMDedxYC163rpFQ_lRRJesg5';
  const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
  const appUrl = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;

  const missing: string[] = [];

  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
    missing.push('VITE_SUPABASE_URL');
  }

  if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key') {
    missing.push('VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY');
  }

  if (missing.length > 0) {
    console.warn(`[1vet Env Validation Warning] Missing or unconfigured environment variables: ${missing.join(', ')}. Using bundled public fallback config.`);
  }

  if (!paystackPublicKey || paystackPublicKey === 'your_paystack_public_key') {
    console.warn('[1vet Env Validation Warning] VITE_PAYSTACK_PUBLIC_KEY is not configured or using test placeholder.');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    paystackPublicKey,
    appUrl,
    isDev,
    isProd,
  };
}

export const env = validateEnv();
