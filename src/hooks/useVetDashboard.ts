import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

export interface VetConsultationItem {
  id: string;
  status: string;
  chief_complaint: string;
  is_urgent: boolean;
  created_at: string;
  scheduled_at?: string | null;
  pet_id?: string | null;
  pet_owner_id?: string | null;
  pet?: {
    id: string;
    name: string;
    species: string;
    breed?: string | null;
    avatar_url?: string | null;
  } | null;
  pet_owner?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
}

export function useVetDashboard() {
  const { profile } = useAuth();

  const query = useQuery({
    queryKey: ['vet-dashboard-consultations', profile?.id],
    queryFn: async (): Promise<VetConsultationItem[]> => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          pet:pets(id, name, species, breed, avatar_url),
          pet_owner:profiles!pet_owner_id(first_name, last_name, email)
        `)
        .or(`veterinarian_id.eq.${profile.id},veterinarian_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as VetConsultationItem[];
    },
    enabled: Boolean(profile?.id),
  });

  return {
    consultations: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
