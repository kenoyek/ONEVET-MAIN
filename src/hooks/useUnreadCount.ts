import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

interface UseUnreadCountReturn {
  unreadCount: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useUnreadCount(): UseUnreadCountReturn {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_unread_message_count', {
        p_user_id: user.id,
      });

      if (error) throw error;
      setUnreadCount(data || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();

    if (!user) return;

    // Subscribe to message changes
    const channel = supabase
      .channel('unread-messages-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount,
  };
}
