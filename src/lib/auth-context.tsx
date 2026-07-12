import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'pet_owner' | 'veterinarian' | 'service_provider' | 'admin';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  license_number: string | null;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, currentUser?: User) => {
    try {
      const activeUser = currentUser || user;
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle to avoid errors if missing

      if (profileData) {
        setProfile(profileData);
      } else {
        // Automatically create missing profile
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: activeUser?.email || '',
            first_name: activeUser?.user_metadata?.first_name || '',
            last_name: activeUser?.user_metadata?.last_name || '',
            customer_type: activeUser?.user_metadata?.customer_type || 'pet_owner',
            vendor_type: activeUser?.user_metadata?.vendor_type || null,
            business_name: activeUser?.user_metadata?.business_name || null,
            location: activeUser?.user_metadata?.location || null,
            license_number: activeUser?.user_metadata?.license_number || null,
            specialty: activeUser?.user_metadata?.specialty || null,
            verification_status: activeUser?.user_metadata?.role === 'veterinarian' ? 'pending' : (activeUser?.user_metadata?.role === 'service_provider' ? 'approved' : 'inactive')
          })
          .select()
          .maybeSingle();

        if (newProfile) {
          setProfile(newProfile);
        } else {
          setProfile(null);
        }
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleData) {
        setRole(roleData.role as AppRole);
      } else {
        // Create user role in DB if missing
        const requestedRole = (activeUser?.user_metadata?.role as AppRole) || 'pet_owner';
        const { data: newRole } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: requestedRole
          })
          .select()
          .maybeSingle();
          
        setRole(newRole ? (newRole.role as AppRole) : requestedRole);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setRole('pet_owner');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id, session.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'PASSWORD_RECOVERY') {
          window.location.href = '/auth?mode=reset';
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id, session.user);
        } else {
          setProfile(null);
          setRole(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      queryClient.clear();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
