import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string;
const effectiveSupabaseUrl = SUPABASE_URL || 'https://placeholder.supabase.co';
const effectiveSupabaseKey = SUPABASE_ANON_KEY || 'sb_publishable_placeholder';

// --- Startup validation ---
// The anon key MUST be a full JWT (starts with "eyJ") or a valid new-format
// publishable key (starts with "sb_publishable_"). Both are accepted by
// supabase-js v2.46+. However a blank value or a short placeholder will cause
// every API call to return 401 silently, making it look like no user is logged in.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[Supabase] VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY must be set. ' +
    'Authentication will not work.'
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(effectiveSupabaseUrl, effectiveSupabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Namespace the storage key to this project's URL so that tokens from a
    // previously-migrated Supabase project are never accidentally reused.
    storageKey: `sb-${effectiveSupabaseUrl.replace(/https?:\/\//, '').split('.')[0]}-auth-token`,
  },
});
