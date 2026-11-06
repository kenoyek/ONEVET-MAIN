import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: string;
  starts_at: string;
  expires_at: string | null;
  plan?: {
    id: string;
    name: string;
    price: number;
    duration_months: number;
    features: unknown;
  } | null;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isActive: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setSubscription(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isActive = (() => {
    if (!subscription) return false;
    if (!['active', 'trial'].includes(subscription.status)) return false;
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) return false;
    return true;
  })();

  return {
    subscription,
    isActive,
    loading,
    error,
    refetch: fetchSubscription,
  };
}
