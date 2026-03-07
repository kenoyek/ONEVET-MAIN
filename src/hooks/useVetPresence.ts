import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

interface UseVetPresenceReturn {
  onlineVetsCount: number;
  isOnline: boolean;
  setOnline: (online: boolean) => Promise<void>;
  loading: boolean;
}

export function useVetPresence(): UseVetPresenceReturn {
  const { user, role, profile } = useAuth();
  const [onlineVetsCount, setOnlineVetsCount] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch online vets count
  const fetchOnlineVetsCount = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_online_vets_count');
      if (error) throw error;
      setOnlineVetsCount(data || 0);
    } catch (err) {
      console.error('Error fetching online vets count:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch current user's presence status (for vets)
  const fetchCurrentPresence = useCallback(async () => {
    if (!user || role !== 'veterinarian') return;

    try {
      // Check profile's is_available status
      if (profile?.is_available !== undefined) {
        setIsOnline(profile.is_available);
      }
    } catch (err) {
      console.error('Error fetching presence:', err);
    }
  }, [user, role, profile]);

  useEffect(() => {
    fetchOnlineVetsCount();
    fetchCurrentPresence();

    // Subscribe to profile changes to track availability
    const channel = supabase
      .channel('online-vets-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          fetchOnlineVetsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOnlineVetsCount, fetchCurrentPresence]);

  const setOnline = async (online: boolean) => {
    if (!user || role !== 'veterinarian') return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_available: online })
        .eq('user_id', user.id);

      if (error) throw error;
      setIsOnline(online);
      
      // Also update/insert presence record
      const { error: presenceError } = await supabase
        .from('vet_presence')
        .upsert({
          user_id: user.id,
          is_online: online,
          last_seen_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (presenceError) {
        console.error('Error updating presence:', presenceError);
      }
    } catch (err) {
      console.error('Error setting online status:', err);
      throw err;
    }
  };

  return {
    onlineVetsCount,
    isOnline,
    setOnline,
    loading,
  };
}
