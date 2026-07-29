import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

export interface PetRecord {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  age?: number | null;
  gender?: string | null;
  weight?: number | null;
  microchip_number?: string | null;
  avatar_url?: string | null;
  owner_id?: string | null;
  created_at: string;
}

export function usePets() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['pets', user?.id],
    queryFn: async (): Promise<PetRecord[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as PetRecord[];
    },
    enabled: Boolean(user?.id),
  });

  return {
    pets: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
