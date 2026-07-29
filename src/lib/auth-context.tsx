import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { CoreRole, LegacyAppRole } from '@/types/platform';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppRole = CoreRole | LegacyAppRole;

export interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  license_number: string | null;
  license_url?: string | null;
  license_verified: boolean;
  is_available: boolean;
  specialty: string | null;
  business_name: string | null;
  business_address: string | null;
  location: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  roles: AppRole[];
  /**
   * TRUE only while we haven't yet received the first auth event from Supabase.
   * Once loading is false, `user` is the single source of truth for "is logged in".
   * Profile/role may still be loading in the background — never use them to gate auth.
   */
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: AppRole,
    metaData?: {
      customerType?: string;
      businessName?: string;
      location?: string;
      licenseNumber?: string;
      specialty?: string;
      vendorType?: string;
    }
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);

  // loading = true until we get the FIRST auth response (session or null).
  // This prevents any flash of "logged out" on page load.
  const [loading, setLoading] = useState(true);

  const mounted = useRef(true);
  // Track whether we have resolved the initial session at least once.
  // This prevents the onAuthStateChange INITIAL_SESSION event from overriding
  // a successful getSession() result with a stale null value.
  const initialSessionResolved = useRef(false);

  // ── Background profile/role fetch ─────────────────────────────────────────
  // IMPORTANT: This function NEVER modifies user/session state.
  // Auth state (user + session) is set exclusively from Supabase auth events.
  const fetchProfile = useCallback(async (authUser: User) => {
    if (!authUser?.id || !mounted.current) return;

    try {
      // ── Profile ───────────────────────────────────────────────────────────
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (profileError) {
        console.warn('[Auth] Profile query failed (non-fatal):', profileError.message);
      }

      if (!mounted.current) return;

      if (profileData) {
        setProfile(profileData as Profile);
      } else if (!profileError) {
        // No profile row — attempt to auto-create from auth metadata
        const meta = authUser.user_metadata ?? {};
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            user_id: authUser.id,
            email: authUser.email ?? '',
            first_name: meta.first_name ?? '',
            last_name: meta.last_name ?? '',
            customer_type: meta.customer_type ?? 'pet_owner',
            vendor_type: meta.vendor_type ?? null,
            business_name: meta.business_name ?? null,
            location: meta.location ?? null,
            license_number: meta.license_number ?? null,
            specialty: meta.specialty ?? null,
            verification_status:
              meta.role === 'veterinarian'
                ? 'pending'
                : meta.role === 'service_provider'
                ? 'approved'
                : 'inactive',
          })
          .select()
          .maybeSingle();

        if (mounted.current) setProfile((newProfile as Profile) ?? null);
      }

      // ── Roles ──────────────────────────────────────────────────────────────
      if (!mounted.current) return;

      const { data: rolesData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id);

      if (roleError) {
        console.warn('[Auth] Roles query failed (non-fatal):', roleError.message);
      }

      if (!mounted.current) return;

      if (rolesData && rolesData.length > 0) {
        const fetchedRoles = rolesData.map((r) => r.role as AppRole);
        setRoles(fetchedRoles);
        setRole(fetchedRoles[0]);
      } else if (!roleError) {
        // No role row — create from metadata
        const requestedRole = (authUser.user_metadata?.role as AppRole) ?? 'pet_owner';
        const { data: newRole } = await supabase
          .from('user_roles')
          .insert({ user_id: authUser.id, role: requestedRole })
          .select()
          .maybeSingle();

        if (mounted.current) {
          const activeRole = newRole ? (newRole.role as AppRole) : requestedRole;
          setRoles([activeRole]);
          setRole(activeRole);
        }
      } else {
        // Role query errored — derive from metadata so UI isn't stuck
        const fallbackRole = (authUser.user_metadata?.role as AppRole) ?? 'pet_owner';
        if (mounted.current) {
          setRoles([fallbackRole]);
          setRole(fallbackRole);
        }
      }
    } catch (err) {
      console.warn('[Auth] fetchProfile error (non-fatal):', err);
      if (mounted.current) {
        const fallbackRole = (authUser.user_metadata?.role as AppRole) ?? 'pet_owner';
        setRoles([fallbackRole]);
        setRole(fallbackRole);
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user);
  }, [user, fetchProfile]);

  // ── Single auth listener ──────────────────────────────────────────────────
  useEffect(() => {
    mounted.current = true;

    // STEP 1 – Subscribe FIRST so we never miss an event.
    // The 'INITIAL_SESSION' event will fire immediately with whatever session
    // is stored. We use this as our primary source of truth.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted.current) return;

        console.debug('[Auth] event:', event, '| user:', newSession?.user?.id ?? 'none');

        if (event === 'PASSWORD_RECOVERY') {
          // Let the current tab handle the reset flow
          if (mounted.current) setLoading(false);
          return;
        }

        // ── Set user/session IMMEDIATELY ─────────────────────────────────────
        // This is what makes the Navbar re-render right away.
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Profile fetch runs in background — auth state is already updated
          fetchProfile(newSession.user);
        } else {
          setProfile(null);
          setRole(null);
        }

        // Mark as no longer loading on the first event we receive
        if (mounted.current) {
          setLoading(false);
          initialSessionResolved.current = true;
        }
      }
    );

    // STEP 2 – getSession() is called AFTER subscribing.
    // In supabase-js v2, onAuthStateChange fires 'INITIAL_SESSION' synchronously
    // from the stored token, so in most cases loading will already be false by
    // the time this resolves. We only use it as a safety net for environments
    // where INITIAL_SESSION doesn't fire (e.g. SSR or certain build configs).
    supabase.auth.getSession().then(({ data: { session: storedSession }, error }) => {
      if (!mounted.current) return;
      if (error) console.error('[Auth] getSession error:', error.message);

      // If onAuthStateChange already resolved the session, skip this — we don't
      // want to overwrite a known user with a potentially delayed null result.
      if (!initialSessionResolved.current) {
        console.debug('[Auth] getSession fallback firing, INITIAL_SESSION was slow');
        setSession(storedSession);
        setUser(storedSession?.user ?? null);

        if (storedSession?.user) {
          fetchProfile(storedSession.user);
        }
        setLoading(false);
        initialSessionResolved.current = true;
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth actions ───────────────────────────────────────────────────────────

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    selectedRole: AppRole,
    metaData?: {
      customerType?: string;
      businessName?: string;
      location?: string;
      licenseNumber?: string;
      specialty?: string;
      vendorType?: string;
    }
  ) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          role: selectedRole,
          customer_type: metaData?.customerType,
          business_name: metaData?.businessName,
          location: metaData?.location,
          license_number: metaData?.licenseNumber,
          specialty: metaData?.specialty,
          vendor_type: metaData?.vendorType,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Auth] signOut API call failed (non-fatal):', err);
    } finally {
      // Always clear locally regardless of API success
      queryClient.clear();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
      setRoles([]);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, role, roles, loading, signUp, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
