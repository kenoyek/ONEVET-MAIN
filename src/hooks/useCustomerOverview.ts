import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
export function useCustomerOverview() {
  const { user, profile } = useAuth();
  const ownerId = profile?.user_id === user?.id ? profile?.id : undefined;
  return useQuery({
    queryKey: ['customer-overview', user?.id, ownerId],
    enabled: !!user?.id && !!ownerId,
    queryFn: async () => {
      const [pets, consultations, subscription, orders] = await Promise.all([
        supabase
          .from('pets')
          .select('id,name,species,avatar_url')
          .eq('owner_id', ownerId!)
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('consultations')
          .select('id,status,chief_complaint,created_at')
          .eq('pet_owner_id', ownerId!)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('subscriptions')
          .select('status,expires_at')
          .eq('user_id', user!.id)
          .maybeSingle(),
        supabase
          .from('orders')
          .select('id,total_amount,status,payment_status,created_at')
          .eq('customer_id', ownerId!)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);
      for (const result of [pets, consultations, subscription, orders])
        if (result.error) throw result.error;
      return {
        pets: pets.data ?? [],
        consultations: consultations.data ?? [],
        subscription: subscription.data,
        orders: orders.data ?? [],
      };
    },
  });
}
